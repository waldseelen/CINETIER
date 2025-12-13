


















# 6) Database (Supabase Postgres) – Şema + RLS İskeleti

Aşağıdaki SQL’i **Supabase migration** olarak bölüp uygulayın. (Uzun ama “başlangıç için tam omurga”.)

## 6.1 Extensions + Enums

```sql
-- extensions
create extension if not exists pgcrypto;

-- enums
do $$ begin
  create type visibility_enum as enum ('public','unlisted','private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type_enum as enum ('movie','tv');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type_enum as enum (
    'follow',
    'tier_list_created',
    'tier_list_updated',
    'tier_list_liked',
    'comment_created',
    'review_created',
    'review_liked',
    'watched',
    'watchlisted',
    'vs_match'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type comment_target_enum as enum ('tier_list','media','review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type elo_scope_enum as enum ('global','user');
exception when duplicate_object then null; end $$;
```

## 6.2 Profiles (Supabase Auth ile)

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  default_watchlist_visibility visibility_enum not null default 'private',
  default_watched_visibility visibility_enum not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 6.3 Media Cache (TMDB)

```sql
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  tmdb_id int not null,
  media_type media_type_enum not null,
  title text not null,
  original_title text,
  poster_path text,
  backdrop_path text,
  release_date date,
  year int,
  overview text,
  tmdb_vote_average numeric(4,2),
  tmdb_vote_count int,
  popularity numeric(10,2),
  adult boolean default false,
  tmdb_json jsonb, -- raw cache (optional)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tmdb_id, media_type)
);

create index if not exists idx_media_title on public.media using gin (to_tsvector('simple', title));
create index if not exists idx_media_pop on public.media (popularity desc);
```

## 6.4 Tier Lists

```sql
create table if not exists public.tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  visibility visibility_enum not null default 'public',
  slug text unique not null,
  template jsonb not null default '{
    "tiers":[
      {"key":"S","label":"S","color":"#ff4d4f"},
      {"key":"A","label":"A","color":"#fa8c16"},
      {"key":"B","label":"B","color":"#fadb14"},
      {"key":"C","label":"C","color":"#52c41a"},
      {"key":"D","label":"D","color":"#1890ff"}
    ]
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tier_list_items (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  tier_key text not null,
  position int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (tier_list_id, media_id)
);

create index if not exists idx_tier_list_items_list on public.tier_list_items (tier_list_id);
```

## 6.5 Watched / Watchlist + Rating + Visibility

Tek tabloda yönetelim:

```sql
create table if not exists public.user_media_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,

  is_watched boolean not null default false,
  is_watchlisted boolean not null default false,

  watched_at timestamptz,
  rating_10 numeric(3,1), -- 0-10, 0.5 step
  short_note text,        -- kısa not
  visibility visibility_enum not null default 'public',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, media_id)
);

create index if not exists idx_user_media_entries_user on public.user_media_entries (user_id);
create index if not exists idx_user_media_entries_media on public.user_media_entries (media_id);
```

> UI kuralı: watchlist eklenince `is_watchlisted=true`. watched olunca `is_watched=true`, `watched_at` set, istenirse watchlist false yapılır (tercih).

## 6.6 Long Review (ayrı tablo: like/comment hedefi olsun)

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  body text not null,
  contains_spoilers boolean not null default false,
  visibility visibility_enum not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, media_id)
);

create index if not exists idx_reviews_media on public.reviews (media_id);
```

## 6.7 Social Graph (follow/block)

```sql
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(user_id) on delete cascade,
  followee_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
```

## 6.8 Likes (tier list + review + comment)

```sql
create table if not exists public.tier_list_likes (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tier_list_id)
);

create table if not exists public.review_likes (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);
```

## 6.9 Comments (tier list + media + review) + comment likes

```sql
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  target_type comment_target_enum not null,
  tier_list_id uuid references public.tier_lists(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- integrity check (exactly one target id must be set) can be enforced with a constraint:
alter table public.comments
  add constraint comments_target_check
  check (
    (case when tier_list_id is null then 0 else 1 end) +
    (case when media_id is null then 0 else 1 end) +
    (case when review_id is null then 0 else 1 end)
    = 1
  );

create index if not exists idx_comments_tierlist on public.comments (tier_list_id);
create index if not exists idx_comments_media on public.comments (media_id);
create index if not exists idx_comments_review on public.comments (review_id);

create table if not exists public.comment_likes (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
```

## 6.10 VS + Elo (global + user)

```sql
create table if not exists public.vs_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  left_media_id uuid not null references public.media(id) on delete cascade,
  right_media_id uuid not null references public.media(id) on delete cascade,
  winner_media_id uuid not null references public.media(id) on delete cascade,
  scope elo_scope_enum not null, -- 'global' or 'user'
  tier_list_id uuid references public.tier_lists(id) on delete set null, -- list-based matches
  created_at timestamptz not null default now()
);

create table if not exists public.elo_ratings (
  scope elo_scope_enum not null,
  user_id uuid references public.profiles(user_id) on delete cascade, -- null when global
  media_id uuid not null references public.media(id) on delete cascade,
  elo int not null default 1200,
  games_played int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, user_id, media_id)
);
```

> Global kayıtlar için `scope='global' AND user_id IS NULL`. (PK bunu kaldırmaz)
Daha temiz çözüm: global ve user için ayrı tablo. İstersen Copilot’a iki tablo yaptır. Burada tek tablo ile gösterdim; pratikte **iki tablo daha basit**:
- `global_elo_ratings(media_id pk, elo, games_played)`
- `user_elo_ratings(user_id, media_id pk, elo, games_played)`

## 6.11 Feed/Activity (MVP’de şart)

```sql
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(user_id) on delete cascade,
  type activity_type_enum not null,
  tier_list_id uuid references public.tier_lists(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  target_user_id uuid references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_actor on public.activities (actor_id, created_at desc);
create index if not exists idx_activities_created on public.activities (created_at desc);
```

## 6.12 Reports (moderasyon)

```sql
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  target_type text not null, -- 'comment','review','tier_list','profile'
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now(),
  status text not null default 'open'
);
```

---

## 6.13 updated_at trigger (öneri)

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_media_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_tier_lists_updated_at
  before update on public.tier_lists
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_user_media_entries_updated_at
  before update on public.user_media_entries
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
```

---

## 6.14 Activity trigger örnekleri (MVP feed için)

Basit yaklaşım: bazı insertlerde activities yaz.

```sql
create or replace function public.log_activity()
returns trigger language plpgsql as $$
begin
  -- follows
  if tg_table_name = 'follows' then
    insert into public.activities(actor_id, type, target_user_id)
    values (new.follower_id, 'follow', new.followee_id);
    return new;
  end if;

  return new;
end $$;

do $$ begin
  create trigger trg_follows_activity
  after insert on public.follows
  for each row execute function public.log_activity();
exception when duplicate_object then null; end $$;
```

Benzer trigger’lar:
- tier_lists insert/update → `tier_list_created/updated`
- tier_list_likes insert → `tier_list_liked`
- comments insert → `comment_created`
- reviews insert → `review_created`
- review_likes insert → `review_liked`
- user_media_entries update (watched/watchlisted değiştiğinde) → watched/watchlisted

> Bunları “tam doğru” yapmak için `old` vs `new` karşılaştırması gerekir. Copilot’a bu mantığı migration’larda yazdırabilirsin.

---

# 7) RLS (Row Level Security) – Kurallar (özet + örnek)

### Genel prensip
- “Write” işlemleri sadece auth user’a ait satırlarda.
- Read: visibility + block kuralları ile.

Aşağıdaki iskelet MVP için yeterli başlangıç:

```sql
alter table public.profiles enable row level security;
alter table public.tier_lists enable row level security;
alter table public.tier_list_items enable row level security;
alter table public.user_media_entries enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.tier_list_likes enable row level security;
alter table public.review_likes enable row level security;
alter table public.comment_likes enable row level security;
alter table public.vs_matches enable row level security;
alter table public.activities enable row level security;
```

Örnek: tier list write policy

```sql
create policy "tier_lists_owner_can_crud"
on public.tier_lists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Örnek: tier list read policy (public/unlisted görülebilir; private sadece owner)

```sql
create policy "tier_lists_read_by_visibility"
on public.tier_lists
for select
using (
  visibility in ('public','unlisted')
  or auth.uid() = user_id
);
```

Örnek: user_media_entries
```sql
create policy "user_media_entries_owner_crud"
on public.user_media_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- public watched/watchlist görüntüleme için ek select policy (opsiyonel):
create policy "user_media_entries_public_read"
on public.user_media_entries
for select
using (visibility in ('public','unlisted') or auth.uid() = user_id);
```

> Block/follow/visibility kesişimleri (tam sosyal privacy) daha ayrıntılıdır; MVP’de temelini at, sonra “blocked user content invisible” kurallarını view/fn ile güçlendir.

---

# 8) API Tasarımı (Next.js Route Handlers)

## 8.1 TMDB Proxy
- `GET /api/tmdb/search?query=...&type=movie|tv|multi`
- `GET /api/tmdb/media?tmdbId=...&type=movie|tv`
Bu endpoint:
- TMDB’den çeker
- `media` tablosuna upsert eder
- client’a normalize edilmiş DTO döndürür

## 8.2 VS Match
- `POST /api/vs/match`
Body:
```json
{
  "leftMediaId":"uuid",
  "rightMediaId":"uuid",
  "winnerMediaId":"uuid",
  "scope":"global|user",
  "tierListId":"uuid|null"
}
```
Server:
- rate limit
- vs_matches insert
- Elo update (transaction): winner + loser

> Elo update’i ideal olarak **SQL function** ile transaction içinde atomik yapılır.

## 8.3 Share OG Image
- `GET /api/share/tierlist/[id]/og`
Server-side OG image üretir (poster grid + tier renkleri + watermark).

---

# 9) Elo Güncelleme (Net algoritma)

`expected = 1 / (1 + 10^((Rb - Ra)/400))`
`Ra' = Ra + K*(Sa - expected)`
- Winner: Sa=1
- Loser: Sa=0
- K: games_played < 20 => 40 else 20

Copilot’a görev: `lib/elo/elo.ts` içinde saf fonksiyon + API route’ta DB update.

---

# 10) Paylaşım Görseli (viral growth)

## Zorunlu çıktı presetleri
- IG portrait: 1080x1350
- X/Twitter: 1200x675

OG render:
- tier list başlığı
- owner username
- tier şeması + posterler
- “cinetier.app” watermark

Storage:
- `tierlist-images` bucket (public)
- snapshot versiyonlama: `tier_list_snapshots` istersen ekle (P1)

---

# 11) Copilot’a “Projeyi sıfırdan oluştur” görev listesi

## 11.1 Kurulum komutları (önerilen)
- Next.js:
  - `pnpm create next-app cinetier --ts --tailwind --app`
- shadcn:
  - `pnpm dlx shadcn@latest init`
- Supabase:
  - `supabase init`
  - `supabase link --project-ref ...`
  - migrations: `supabase migration new init_schema`
  - `supabase db push`
- Types:
  - `supabase gen types typescript --local > types/supabase.ts`

## 11.2 package bağımlılıkları (minimum)
- `@supabase/supabase-js`
- `@supabase/auth-helpers-nextjs`
- `@tanstack/react-query`
- `zod`
- `react-hook-form`
- `@dnd-kit/core @dnd-kit/sortable`
- `@vercel/og`
- (opsiyonel) `@upstash/ratelimit @upstash/redis`
- (opsiyonel) `recharts` (radar)
- (opsiyonel) `dompurify` (XSS için, yorum/review render edilecekse)

---

# 12) Geliştirme Planı (Hepsi var ama doğru sırayla)

## Milestone 1 (çekirdek veri + auth + media)
- Supabase auth + profiles
- TMDB proxy + media cache
- Media detail sayfası

## Milestone 2 (watched/watchlist/rating/review)
- user_media_entries CRUD
- reviews CRUD (long review)
- review/comments/likes

## Milestone 3 (tier builder)
- tier list create/edit/view
- dnd-kit
- tier_list_items persistence
- list visibility

## Milestone 4 (social)
- follow/unfollow
- feed (activities)
- like/comment her hedefte

## Milestone 5 (VS Elo)
- VS UI
- global + user Elo
- list-based VS
- leaderboard sayfası

## Milestone 6 (sharing)
- OG image render
- download/share presets
- (ops.) snapshot storage

---

# 13) İçerik/konsept metni (site copy önerisi)
**Hero:**
- “Zevkini Tier’la. VS ile ispatla. Profilinde sergile.”

**Alt başlıklar:**
- “Tier listeni sürükle-bırak ile 2 dakikada oluştur.”
- “İki seçenek, tek karar: VS ile Elo’n yükselsin.”
- “Watched / Watchlist, puan, kısa not veya uzun review.”
- “Takip et, feed’ini kur: arkadaşlarının zevkini gör.”

---
