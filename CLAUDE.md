# CLAUDE.md - CineTier Development Guide

This file provides guidance for Claude AI when working on CineTier codebase.

---

## Project Context

**CineTier** is a full-stack Next.js application for creating, sharing, and comparing film/TV show tier lists with social features (ratings, vs mode, comments, notifications).

### Tech Stack
- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Supabase PostgreSQL
- **External APIs:** TMDB, Jikan (MyAnimeList), OMDb
- **State:** TanStack Query v5
- **UI:** shadcn/ui components

---

## Core Principles

### 1. Immutability First
- ✅ Always create new objects when modifying state
- ✅ Use spread operator: `{ ...state, field: newValue }`
- ✅ Never mutate arrays/objects directly
- ❌ Don't use `array.push()`, `obj.prop = value`

**Example:**
```typescript
// WRONG ❌
function updateRating(ratings, id, value) {
  ratings[id] = value;
  return ratings;
}

// RIGHT ✅
function updateRating(ratings, id, value) {
  return { ...ratings, [id]: value };
}
```

### 2. File Organization
- **Max file size:** 800 lines (typically 200-400)
- **Organize by feature/domain, not by type**
- Extract utilities into separate files when logic > 100 lines
- One component per file (exceptions: UI primitives)

### 3. API Response Format
All API endpoints return consistent envelope:
```typescript
{
  success: boolean;      // success/error status
  data: T | null;        // payload (null on error)
  error?: string;        // error message (null on success)
  meta?: {               // optional metadata
    total?: number;      // for paginated responses
    page?: number;
    limit?: number;
  }
}
```

### 4. Error Handling
- ✅ Explicit error handling at every level
- ✅ Meaningful error messages for users
- ✅ Detailed logging on server side
- ✅ Never silently swallow errors
- ❌ No generic "Something went wrong"

---

## Project Structure

```
lib/
├── supabase/          # Database client & utilities
├── tmdb/              # TMDB API wrapper with rate limiting
├── jikan/             # Jikan API wrapper (MyAnimeList)
├── omdb/              # OMDb API wrapper
├── elo/               # Elo rating algorithm
├── hooks/             # Custom React hooks (useAuth, useQuery, etc.)
├── env-validator.ts   # Environment variable validation
└── utils.ts           # Helper functions

app/api/
├── tmdb/              # TMDB endpoints
├── anime/             # Anime/Jikan endpoints
├── ratings/           # User rating operations
├── vs/                # VS mode & Elo calculation
├── notifications/     # Notification system
├── search/unified     # Cross-source search
├── blocks/            # User blocking
└── reports/           # Content moderation

components/
├── tier/              # Tier list builder components
├── media/             # Media cards, details, ratings
├── social/            # Comments, notifications, interactions
├── vs/                # VS mode UI
└── ui/                # shadcn/ui primitives
```

---

## API Integration Pattern

### Adding New External API

1. Create wrapper in `lib/{api-name}/`
   - Client initialization
   - Rate limiting handling
   - Error handling
   - Type definitions

2. Example (TMDB):
```typescript
// lib/tmdb/client.ts
export const tmdb = {
  trending: async (type: 'movie' | 'tv') => {
    return api.get('/trending/{type}/week', { type });
  }
};
```

3. Create API route in `app/api/{api-name}/`
   - Validation
   - Error handling
   - Response envelope

4. Use in components via TanStack Query:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['tmdb', 'trending', type],
  queryFn: () => fetch(`/api/tmdb/trending?type=${type}`).then(r => r.json())
});
```

---

## Database Pattern (Supabase)

### Migrations
- Create in `db/migrations/` with sequential numbering
- Format: `000_description.sql`
- Always include RLS (Row Level Security) policies
- Test locally before deploying

### Type Generation
```bash
npm run db:generate  # Generates types/supabase.ts from schema
```

### Example Query Pattern
```typescript
// Server-side (API Route)
import { supabase } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', userId);

  if (error) return json({ success: false, error: error.message });
  return json({ success: true, data });
}

// Client-side (Component)
const { data } = useQuery({
  queryKey: ['ratings', userId],
  queryFn: () => fetch(`/api/ratings?userId=${userId}`).then(r => r.json())
});
```

---

## Component Guidelines

### React Hooks
- Use functional components only
- Custom hooks: `useAuth`, `useMediaDetails`, `useNotifications`, etc.
- Hooks in `lib/hooks/` directory

### TanStack Query Usage
- Always use for server state (API calls)
- Set proper `staleTime` to reduce requests
- Handle loading and error states explicitly
- Example:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['media', id],
  queryFn: () => fetch(`/api/tmdb/media/${id}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```

### Props Pattern
```typescript
interface MediaCardProps {
  media: Media;
  onRate?: (rating: number) => void;
  className?: string;
}

export function MediaCard({ media, onRate, className }: MediaCardProps) {
  return <div className={className}>...</div>;
}
```

---

## Testing Requirements

### Minimum Coverage: 80%

Test all:
- ✅ API endpoints (integration tests)
- ✅ Utility functions (unit tests)
- ✅ Custom hooks (hook tests)
- ✅ Critical user flows (e2e tests)

### Test Command
```bash
node tests/run-all.js
```

---

## Common Patterns

### 1. Unified Search (TMDB + Jikan)
Located: `app/api/search/unified/route.ts`
- Searches both TMDB and Jikan simultaneously
- Returns combined, deduplicated results
- Maintains source information for each result

### 2. Elo Rating System
Located: `lib/elo/`
- Used in VS mode
- Calculates rating change after match
- Handles leaderboard updates

### 3. Rate Limiting
- TMDB: 20 requests/second (built-in)
- Jikan: ~2.8 requests/second (free tier)
- Optional Redis for advanced limiting

### 4. OG Image Generation
Located: `app/api/share/tierlist/[id]/og/route.ts`
- Dynamic image generation
- Runs on Edge Runtime
- Uses Vercel `@vercel/og`

---

## Environment Variables

### Required for Development
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID
TMDB_API_KEY
TMDB_ACCESS_TOKEN
```

### Optional
```
OMDB_API_KEY              # For additional ratings (IMDb, RT, Metascore)
UPSTASH_REDIS_REST_URL    # For advanced rate limiting
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL       # App URL for sharing
```

### Validation
```bash
npm run check:env  # Manual validation
npm run build      # Build includes validation
```

---

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable with clear variable names
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (max 4 levels)
- [ ] Comprehensive error handling
- [ ] No hardcoded values (use constants/config)
- [ ] Immutability maintained (no mutations)
- [ ] TypeScript types properly defined
- [ ] No console.log debugging left
- [ ] Tests pass (80%+ coverage)

---

## Git Workflow

### Commit Format
```
<type>: <description>

<optional body>

Examples:
feat: add anime support via Jikan API
fix: resolve rating badge TypeScript error
refactor: extract Supabase query utilities
docs: update API endpoint documentation
test: add tier list builder tests
chore: update dependencies
```

### Before Committing
1. Run tests: `node tests/run-all.js`
2. Check types: `npm run build`
3. No secrets in code: `.env.local` not committed
4. Branch name: lowercase with hyphens (`feature/anime-support`)

---

## Performance Notes

### Query Optimization
- Use TanStack Query's `staleTime` to reduce API calls
- Implement pagination for large lists
- Lazy-load images with `next/image`

### Bundle Size
- Tree-shake unused code
- Lazy-load heavy components (Recharts radar, etc.)
- Code-split API route handlers

### Database Queries
- Use indexes on frequently filtered columns
- Select only needed columns (not *)
- Cache complex aggregations

---

## When to Use Agents

Per `AGENTS.md`:

| Task | Agent | Trigger |
|------|-------|---------|
| Feature planning | **planner** | Complex features, refactoring |
| Code written | **code-reviewer** | After any code change |
| New feature/bug fix | **tdd-guide** | Before implementation |
| Build fails | **build-error-resolver** | When `npm run build` fails |
| E2E tests | **e2e-runner** | For critical user flows |
| Type errors | Built-in TypeScript | Part of `npm run build` |

---

## Debugging Tips

### API Issues
```bash
# Check environment
npm run check:env

# Inspect Supabase queries
# Add console.log in lib/supabase/server.ts
# Check network tab in DevTools

# Rate limiting
# Look for 429 responses from TMDB/Jikan
# Adjust in lib/tmdb/client.ts
```

### Client-Side Issues
```typescript
// Enable React Query dev tools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Production build with type check
npm run lint            # ESLint check

# Database
npm run db:generate     # Generate Supabase types

# Testing
node tests/run-all.js   # Run all tests
node tests/lib/utils.test.js  # Single test file

# Environment
npm run check:env       # Validate environment variables
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TMDB API Docs](https://developer.themoviedb.org/docs)
- [Jikan API Docs](https://docs.api.jikan.moe)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## Support

Questions about the codebase? Check:
1. `AGENTS.md` - Which agent to use for this task
2. `ARCHITECTURE.md` - System design & data flow
3. Relevant `/lib` directory files
4. Existing similar implementations in codebase
