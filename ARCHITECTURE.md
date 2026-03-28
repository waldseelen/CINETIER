# ARCHITECTURE.md - CineTier System Design

This document describes the system architecture, data flow, and design decisions.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CineTier Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Frontend (Next.js App)                 │    │
│  │  ├─ Pages (/, /create, /list, /vs, /leaderboard)  │    │
│  │  ├─ Components (tier-builder, media-card, etc.)    │    │
│  │  └─ Client State (TanStack Query)                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Backend (Next.js API Routes)                │    │
│  │  ├─ /api/tmdb/* (trending, search, details)       │    │
│  │  ├─ /api/anime/* (Jikan MyAnimeList)              │    │
│  │  ├─ /api/ratings/* (user ratings & Elo)           │    │
│  │  ├─ /api/notifications/* (real-time events)       │    │
│  │  └─ /api/search/unified (cross-source search)     │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↓                    ↓                   ↓         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Supabase   │  │ External     │  │  Rate Limited    │  │
│  │ PostgreSQL   │  │   APIs       │  │  API Calls       │  │
│  │              │  │              │  │                  │  │
│  │ • ratings    │  │ • TMDB       │  │ • Caching        │  │
│  │ • tier_lists │  │ • Jikan      │  │ • Throttling     │  │
│  │ • comments   │  │ • OMDb       │  │                  │  │
│  │ • users      │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Domains

### 1. Media Database Layer
**Purpose:** Unified interface for film, TV, anime data

**Components:**
- **TMDB API** - Films & TV shows (primary source)
- **Jikan API** - Anime/Manga (MyAnimeList mirror)
- **OMDb API** - Additional ratings (IMDb, Rotten Tomatoes, Metascore)

**Data Flow:**
```
User Search Query
       ↓
lib/tmdb/client.ts ─ TMDB API
lib/jikan/client.ts ─ Jikan API
       ↓
/api/search/unified
       ↓
Merge & Deduplicate Results
       ↓
Return to Client
```

**Key Files:**
- `lib/tmdb/client.ts` - TMDB wrapper
- `lib/jikan/client.ts` - Jikan wrapper
- `lib/omdb/client.ts` - OMDb wrapper
- `app/api/search/unified/route.ts` - Search aggregation

---

### 2. Tier List System
**Purpose:** User-created ranked lists of media

**Database Schema:**
```sql
-- Tier lists created by users
CREATE TABLE tier_lists (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  title TEXT,
  description TEXT,
  media_type ENUM('film', 'tv', 'anime'),
  slug TEXT UNIQUE,
  is_public BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Individual items in tier lists
CREATE TABLE tier_list_items (
  id UUID PRIMARY KEY,
  tier_list_id UUID (FK),
  media_id TEXT,           -- TMDB ID or MAL ID
  tier ENUM('S', 'A', 'B', 'C', 'D'),
  position INT,            -- Drag-drop order
  media_source ENUM('tmdb', 'jikan'),
  media_data JSONB,        -- Cached poster, title, etc.
);

-- User ratings (1-10) of media
CREATE TABLE ratings (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  media_id TEXT,
  media_source ENUM('tmdb', 'jikan'),
  rating INT (1-10),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Components:**
- `components/tier/TierListBuilder` - Drag-drop interface
- `components/tier/TierItem` - Individual item
- `lib/hooks/useTierList` - State management

**Data Flow:**
```
Create Tier List
       ↓
/api/tier-lists (POST)
       ↓
Validate & Store in Supabase
       ↓
Return tier_list_id
       ↓
Client stores locally (TanStack Query)
       ↓
Drag-drop items
       ↓
/api/tier-lists/{id}/items (PATCH)
       ↓
Update Supabase positions
       ↓
Refetch & display
```

**Key Files:**
- `app/create/page.tsx` - Create UI
- `app/list/[slug]/page.tsx` - View page
- `app/api/tier-lists/*` - CRUD endpoints

---

### 3. VS Mode & Elo Rating System
**Purpose:** Compare media items, rank players by Elo

**Elo Algorithm:**
```
Initial Rating: 1600

After each match:
  ΔRating = K × (Actual - Expected)

Where:
  K = 32 (rating change factor)
  Actual = 1 if won, 0 if lost
  Expected = 1 / (1 + 10^((opponent_rating - your_rating) / 400))
```

**Database Schema:**
```sql
-- VS matches between two media items
CREATE TABLE vs_matches (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  media_a_id TEXT,
  media_a_source ENUM('tmdb', 'jikan'),
  media_b_id TEXT,
  media_b_source ENUM('tmdb', 'jikan'),
  winner ENUM('a', 'b'),
  rating_change INT,
  created_at TIMESTAMP
);

-- User Elo ratings
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  current_rating DECIMAL (default 1600),
  total_matches INT,
  wins INT,
  updated_at TIMESTAMP
);
```

**Data Flow:**
```
User selects winner in VS mode
       ↓
/api/vs/submit-match (POST)
       ↓
Calculate Elo change
       ↓
Update both players' ratings
       ↓
Log match result
       ↓
Refetch leaderboard
```

**Elo Calculation:**
```typescript
// lib/elo/calculate.ts
function calculateElo(
  yourRating: number,
  opponentRating: number,
  didWin: boolean
): { newRating: number; change: number } {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - yourRating) / 400));
  const actual = didWin ? 1 : 0;
  const change = Math.round(K * (actual - expected));
  return {
    newRating: yourRating + change,
    change
  };
}
```

**Key Files:**
- `lib/elo/calculate.ts` - Algorithm
- `app/vs/page.tsx` - VS UI
- `app/leaderboard/page.tsx` - Rankings
- `app/api/vs/submit-match/route.ts` - Match handler

---

### 4. User Authentication & Profiles
**Purpose:** User accounts, authentication, profiles

**Provider:** Supabase Auth
- Magic link login
- OAuth (Google, GitHub, etc.)
- Session management

**Database Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY (from auth.users),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tier_lists_count INT,
  followers_count INT,
  following_count INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE user_follows (
  id UUID PRIMARY KEY,
  follower_id UUID (FK),
  following_id UUID (FK),
  created_at TIMESTAMP
);
```

**Components:**
- `lib/hooks/useAuth` - Auth state
- `components/auth/LoginForm` - Login UI
- `app/auth/callback` - OAuth callback

**Key Files:**
- `lib/supabase/auth.ts` - Auth utilities
- `lib/supabase/server.ts` - Server-side client
- `app/api/auth/*` - Auth endpoints

---

### 5. Social Features
**Purpose:** User interactions (ratings, comments, notifications)

**Components:**

#### 5a. Ratings
- User rates media (1-10)
- User rates actors (Acting, Charisma, Voice)
- Stored in `ratings` & `person_ratings` tables

#### 5b. Comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  tier_list_id UUID (FK),
  parent_id UUID (nullable, for threading),
  content TEXT,
  likes INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE comment_likes (
  id UUID PRIMARY KEY,
  user_id UUID (FK),
  comment_id UUID (FK)
);
```

Threaded structure:
```
Comment A (parent)
├─ Reply B (parent_id = A)
└─ Reply C (parent_id = A)
```

#### 5c. Notifications
Triggered by:
- User follows you
- Someone likes your comment
- Someone replies to your comment
- Someone rates one of your tier lists

**Key Files:**
- `app/api/ratings/*` - Rating endpoints
- `app/api/comments/*` - Comment endpoints
- `app/api/notifications/*` - Notification endpoints
- `components/social/*` - UI components

---

### 6. Search System
**Purpose:** Cross-source media search (TMDB + Jikan)

**Architecture:**
```
User Query
    ↓
/api/search/unified
    ├─ Parallel fetch:
    │  ├─ TMDB (films, TV)
    │  └─ Jikan (anime)
    ├─ Combine results
    ├─ Deduplicate (same title/year)
    ├─ Preserve source info
    └─ Return merged list
    ↓
Client displays with source badges
(TMDB | MAL | Custom)
```

**Response Format:**
```typescript
{
  success: true,
  data: [
    {
      id: '123',
      source: 'tmdb',
      type: 'movie',
      title: 'Inception',
      poster: 'url...',
      year: 2010,
      rating: 8.8,
      genres: ['Sci-Fi', 'Action']
    },
    {
      id: '456',
      source: 'jikan',
      type: 'anime',
      title: 'Neon Genesis Evangelion',
      poster: 'url...',
      year: 1995,
      rating: 7.5,
      genres: ['Sci-Fi', 'Mecha']
    }
  ]
}
```

**Key Files:**
- `app/api/search/unified/route.ts` - Search handler
- `lib/tmdb/search.ts` - TMDB search wrapper
- `lib/jikan/search.ts` - Jikan search wrapper

---

## Data Flow Diagrams

### 1. Create & Share Tier List
```
Frontend (Create Page)
    ↓
Search API (unified search)
    ↓
Select films → Add to tier list
    ↓
Drag items to tiers (local state)
    ↓
Click "Publish" → POST /api/tier-lists
    ↓
Supabase stores:
├─ tier_lists (create row)
└─ tier_list_items (create rows for each item)
    ↓
Return slug (e.g., /list/my-top-movies)
    ↓
Share link
```

### 2. VS Mode Flow
```
User on /vs page
    ↓
Fetch 2 random media from DB
    ↓
Display side-by-side
    ↓
User clicks winner
    ↓
POST /api/vs/submit-match
    ↓
Backend calculates Elo
    ↓
Update user_ratings table
    ↓
Log vs_matches entry
    ↓
Refetch leaderboard (TanStack Query)
    ↓
Show new rating + change
```

### 3. Search & Discover Flow
```
User types query on /search
    ↓
Client debounces input (300ms)
    ↓
GET /api/search/unified?q=inception
    ↓
Backend:
├─ fetch TMDB movies + TV
└─ fetch Jikan anime
    ↓
Merge, deduplicate, rank by relevance
    ↓
Return top 20 results
    ↓
Display with source badge (TMDB | MAL)
    ↓
User clicks result → /media/[type]/[id]
    ↓
Fetch full details + ratings
```

---

## API Response Pattern

All endpoints follow this envelope:
```typescript
type ApiResponse<T> = {
  success: boolean;      // true on success, false on error
  data: T | null;        // payload (null on error)
  error?: string;        // error message (only on failure)
  meta?: {               // optional metadata
    total?: number;      // for paginated results
    page?: number;
    limit?: number;
  }
}
```

**Example Responses:**

Success:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Inception",
    "rating": 8.8
  }
}
```

Error:
```json
{
  "success": false,
  "data": null,
  "error": "Media not found"
}
```

Paginated:
```json
{
  "success": true,
  "data": [
    { "id": "1", "title": "Film 1" },
    { "id": "2", "title": "Film 2" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## Security Architecture

### 1. Row Level Security (RLS)
Supabase enforces row-level access:
```sql
-- Users can only see their own tier lists or public ones
ALTER TABLE tier_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_see_own_tier_lists"
  ON tier_lists
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "users_can_update_own_tier_lists"
  ON tier_lists
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### 2. API Authentication
- Server endpoints use `SUPABASE_SERVICE_ROLE_KEY` (secret)
- Client endpoints use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- Session tokens managed by Supabase Auth

### 3. Input Validation
All user inputs validated with Zod schemas:
```typescript
// lib/validators.ts
export const createTierListSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  mediaType: z.enum(['film', 'tv', 'anime']),
  isPublic: z.boolean().default(true)
});

// In API route
const validated = createTierListSchema.parse(req.body);
```

---

## Performance Optimizations

### 1. Caching Strategy
```typescript
// TanStack Query staleTime prevents refetches
const { data } = useQuery({
  queryKey: ['media', id],
  queryFn: () => fetch(`/api/media/${id}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000     // 10 minutes (garbage collection)
});
```

### 2. Rate Limiting
- **TMDB:** 20 req/sec (built-in SDK limiting)
- **Jikan:** ~2.8 req/sec (free tier)
- **Upstash Redis:** Optional advanced throttling

### 3. Image Optimization
```typescript
// next/image for automatic optimization
<Image
  src={media.posterUrl}
  width={300}
  height={450}
  alt={media.title}
  priority={isAboveFold}
/>
```

### 4. Code Splitting
- Lazy-load heavy components (Recharts, Framer Motion)
- Dynamic imports for admin-only features
- Separate API route handlers (tree-shaking)

---

## Database Schema Overview

```
Users & Auth
├─ auth.users (Supabase Auth)
├─ users (profile info)
└─ user_follows (relationships)

Media & Ratings
├─ tier_lists
├─ tier_list_items
├─ ratings (1-10)
├─ person_ratings (Acting/Charisma/Voice)
└─ vs_matches (comparison history)

Social
├─ comments
├─ comment_likes
└─ notifications

Moderation
├─ reports
└─ blocks
```

See `db/migrations/` for full SQL schema.

---

## Environment Dependencies

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - DB connection
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client auth
- `SUPABASE_SERVICE_ROLE_KEY` - Server operations

**Media APIs:**
- `TMDB_ACCESS_TOKEN` - Film/TV data
- `JIKAN_API_BASE` - Anime data (public, no key)
- `OMDB_API_KEY` - Alternative ratings

**Optional:**
- `UPSTASH_REDIS_REST_URL` - Rate limiting
- `NEXT_PUBLIC_APP_URL` - Sharing base URL

---

## Deployment Architecture

### Vercel (Recommended)
```
GitHub Push
    ↓
Vercel Webhook
    ↓
npm install
npm run build (includes TypeScript check)
    ↓
Build succeeds?
├─ YES → Deploy
│        API routes → Serverless Functions
│        Static pages → CDN
│        OG images → Edge Runtime
└─ NO  → Rollback
```

### Self-Hosted
```
npm run build
npm start
# Runs on localhost:3000
# Handle process management (PM2, systemd)
# Handle SSL/HTTPS reverse proxy
```

---

## Scaling Considerations

### Current Limits
- Supabase PostgreSQL (Standard: 4GB)
- TMDB API (20 req/sec)
- Jikan API (~2.8 req/sec)

### When to Scale
1. **Database** - Add RLS indexes, partition large tables
2. **APIs** - Implement caching, add Upstash Redis
3. **Frontend** - Code split further, add service worker
4. **Infrastructure** - Move to dedicated Postgres, add Redis cluster

---

## Key Architectural Decisions

| Decision | Why | Alternative |
|----------|-----|-------------|
| **Next.js App Router** | Modern, built-in routing | Pages router (old) |
| **Supabase** | Postgres + Auth + RLS | Firebase, MongoDB |
| **Multiple APIs** | TMDB + Jikan + OMDb coverage | Single source |
| **TanStack Query** | Automatic caching, sync | Redux, Zustand |
| **Elo for ranking** | Fair comparison system | Rating aggregation |
| **OG images** | Easy sharing | Manual upload |
| **Edge Functions** | Vercel optimized | Serverless alternatives |

---

## Questions?

Refer to:
- **CLAUDE.md** - Coding patterns & implementation
- **AGENTS.md** - Which agent to use when
- **README.md** - Quick start & setup
- `db/migrations/` - Database schema
- `app/api/*/` - Endpoint implementations
