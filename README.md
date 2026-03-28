# 🎬 **CineTier** - Film & TV Tier List Builder

> Film ve dizi tier listeleri yap, karşılaştır, paylaş. Topluluğun zevkini keşfet! 🍿

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

---

## ✨ Özellikler

| 🎯 Core | 🆚 Sosyal | 📊 Analiz |
|---|---|---|
| **Tier List Builder** - Sürükle-bırak ile S/A/B/C/D tier'lar | **VS Modu** - İki film karşılaştır, Elo sıralaması | **Leaderboard** - Oyuncu sıralaması |
| **Film & Dizi Detayı** - TMDB + Jikan + OMDb verisi | **Threaded Yorumlar** - Cevapla, aç-kapa | **Elo Rating** - Dinamik sıralama |
| **Anime Desteği** - MyAnimeList entegrasyonu | **Bildirimler** - Gerçek zamanlı güncelleme | **Radar Chart** - Oyuncu puanlaması |
| **Kişi Radar** - Acting/Charisma/Voice puanı | **OG Görsel Üretimi** - Sosyal medya paylaşı | **Dark Mode** - Neon yeşil tema |

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm/yarn/pnpm
- Supabase hesabı
- TMDB API anahtarı

### 1️⃣ Repo'yu Klonla ve Kur
```bash
git clone https://github.com/waldseelen/CINETIER.git
cd CINETIER
npm install
```

### 2️⃣ Environment Değişkenlerini Ayarla

Dosya oluştur: `.env.local`

```bash
# ========== ZORUNLU (Uygulama çalışmaz) ==========
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=your_project_id

# ========== ÖNERILEN (API Entegrasyonları) ==========
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_access_token

# ========== İSTEĞE BAĞLI (Opsiyonel Özellikler) ==========
OMDB_API_KEY=your_omdb_api_key                     # Ek rating bilgileri
UPSTASH_REDIS_REST_URL=your_redis_url              # Rate limiting
UPSTASH_REDIS_REST_TOKEN=your_redis_token

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**API Anahtarlarını Alın:**
- [TMDB API](https://www.themoviedb.org/settings/api) - Film/Dizi veri tabanı
- [OMDB API](https://www.omdbapi.com/apikey.aspx) - Ek rating bilgileri
- [Upstash](https://upstash.com) - Rate limiting (opsiyonel)

### 3️⃣ Supabase Veritabanını Kur

Supabase SQL Editor'da aşağıdaki migrations'ı sırayla çalıştır:

```bash
# Option 1: El ile (Supabase Dashboard)
# Copy-paste her migration dosyasını SQL Editor'a

# Option 2: CLI (önerilir)
supabase migration up
```

Migrations sırası:
1. `db/migrations/001_initial_schema.sql` - Ana schema
2. `db/migrations/002_rls_policies.sql` - Güvenlik politikaları
3. `db/migrations/003_person_ratings.sql` - Oyuncu puanlama
4. `db/migrations/004_notifications.sql` - Bildirim sistemi
5. `db/migrations/005_external_ratings_anime.sql` - Anime desteği

### 4️⃣ Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Uygulama açılacak: **http://localhost:3000**

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** TanStack Query (React Query) v5
- **Animation:** Framer Motion
- **Drag & Drop:** dnd-kit

### Backend & Data
- **API Routes:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (magic link, OAuth)
- **ORM:** Direct SQL (migrations)

### External APIs
- **TMDB API** - Film/Dizi bilgisi (trending, search, details)
- **Jikan API** - Anime bilgisi (MyAnimeList)
- **OMDb API** - Ek rating bilgileri (IMDb, Rotten Tomatoes, Metascore)

### DevTools
- **Linting:** ESLint 9
- **Type Checking:** TypeScript
- **Package Manager:** npm (pnpm/yarn uyumlu)

---

## 📁 Proje Yapısı

```
CINETIER/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Ana sayfa
│   ├── (auth)/                  # Auth sayfaları
│   ├── api/                     # API routes
│   │   ├── tmdb/               # TMDB entegrasyonu
│   │   ├── anime/              # Jikan entegrasyonu
│   │   ├── ratings/            # Kullanıcı puanlaması
│   │   ├── vs/                 # VS modu ve Elo
│   │   ├── notifications/      # Bildirim sistemi
│   │   └── search/             # Unified search
│   ├── create/                 # Tier list oluştur
│   ├── list/[slug]/            # Tier list görüntüle
│   ├── explore/                # Trending sayfası
│   ├── vs/                     # VS modu UI
│   ├── leaderboard/            # Elo sıralaması
│   └── media/[type]/[tmdbId]/ # Film/Dizi detayı
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── tier/                   # Tier list builder
│   ├── media/                  # Media cards & details
│   ├── social/                 # Yorumlar, bildirimler
│   └── vs/                     # VS modu componenti
├── lib/
│   ├── supabase/              # Supabase client & utilities
│   ├── tmdb/                  # TMDB API wrapper
│   ├── jikan/                 # Jikan API wrapper
│   ├── omdb/                  # OMDb API wrapper
│   ├── elo/                   # Elo algoritması
│   ├── hooks/                 # Custom React hooks
│   ├── utils.ts               # Utility functions
│   ├── validators.ts          # Input validation
│   └── env-validator.ts       # Environment check
├── db/
│   └── migrations/            # SQL migration files
├── public/                    # Static assets
├── types/                     # TypeScript type definitions
├── .env.example               # Environment template
├── CLAUDE.md                  # Claude AI instructions
├── AGENTS.md                  # Agent workflow docs
├── ARCHITECTURE.md            # System architecture
└── package.json
```

---

## 📍 Sayfalar & Routes

| Route | Açıklama | Auth | Note |
|-------|----------|------|------|
| `/` | 🏠 Ana sayfa | - | Landing page |
| `/explore` | 🔍 Trending | - | TMDB + Jikan trending |
| `/search` | 🔎 Arama | - | Unified search |
| `/create` | ➕ Oluştur | ✅ | Tier list builder |
| `/list/[slug]` | 📋 Görüntüle | - | Paylaşılan tier list |
| `/vs` | ⚔️ VS Modu | - | Karşılaştırma |
| `/leaderboard` | 🏆 Sıralama | - | Elo ratings |
| `/media/[type]/[tmdbId]` | 🎬 Detay | - | Film/Dizi full info |
| `/person/[tmdbId]` | ⭐ Oyuncu | - | Acting/Charisma ratings |
| `/anime/[malId]` | 📺 Anime | - | Anime detayı |
| `/user/[username]` | 👤 Profil | - | Kullanıcı sayfası |
| `/notifications` | 🔔 Bildirim | ✅ | Gerçek zamanlı |
| `/settings` | ⚙️ Ayarlar | ✅ | Hesap & tema |

---

## 🧬 API Endpoints

### TMDB Integration
```
GET  /api/tmdb/trending        → Trending films/TV shows
GET  /api/tmdb/search          → Search with filters
GET  /api/tmdb/media           → Media details (film/dizi)
GET  /api/tmdb/person          → Person (actor) details
```

### Anime & Alternative Sources
```
GET  /api/anime                → MyAnimeList (Jikan)
GET  /api/search/unified       → Cross-source search
```

### User Features
```
POST /api/ratings              → User rating save
POST /api/person-ratings       → Actor rating (Acting/Charisma/Voice)
POST /api/vs/leaderboard       → VS match result & Elo update
GET  /api/notifications        → User notifications
POST /api/blocks               → Block/Unblock user
POST /api/reports              → Content moderation
```

---

## 🔒 Güvenlik & Environment

### Gerekli Environment Variables
```
NEXT_PUBLIC_*                  → Client-side (safe)
SUPABASE_SERVICE_ROLE_KEY      → Server-only (secret)
TMDB_ACCESS_TOKEN              → Server-only (secret)
```

### Validation
Uygulama başlatıldığında `lib/env-validator.ts` otomatik kontrol eder:
- ✅ Zorunlu variables mevcek mi?
- ✅ Format doğru mu?
- ⚠️ Uyarı loglanır eksikler için

### Build Kontrolü
```bash
npm run check:env              # Manual check
npm run build                  # Build check + deployment
```

---

## 🚀 Deploy

### Vercel (Önerilen)
1. Repoyu GitHub'a push et
2. Vercel.com'de import et
3. Environment variables ekle
4. Deploy!

```bash
# Command line ile
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... diğer variables
vercel deploy
```

### Self-Hosted
```bash
npm run build
npm start                      # Production server
```

**Not:** OG image generation endpoints Edge Runtime'da çalışır (Vercel optimal)

---

## 💡 Güzellikler

✅ **Tier List Builder** - Drag-drop ile kolay kullanım
✅ **VS Modu** - Elo rating sistemi ile dinamik sıralama
✅ **Multi-Source** - Film, Dizi, Anime, Kişi tek arayüzde
✅ **Anime Desteği** - MyAnimeList entegrasyonu
✅ **OG Görsel Üretimi** - Twitter & Instagram share ready
✅ **Threaded Yorumlar** - Cevapla, aç-kapa yapısı
✅ **Gerçek Zamanlı** - Database triggers → bildirimler
✅ **Command Palette** - Cmd/Ctrl+K navigasyon
✅ **Dark Mode** - Neon yeşil tema
✅ **Responsive** - Mobile, tablet, desktop

---

## 📚 Dokümantasyon

- **[CLAUDE.md](./CLAUDE.md)** - AI geliştirme kuralları
- **[AGENTS.md](./AGENTS.md)** - Agent workflow rehberi
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Sistem tasarımı

---

## 📄 Lisans

MIT - Açık kaynak, kullan istediğin gibi! 🎉

**Atıf zorunlu:** [TMDB API](https://www.themoviedb.org) • [Jikan API](https://jikan.moe) • [OMDb API](https://www.omdbapi.com)
