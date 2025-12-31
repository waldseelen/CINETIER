# 🎬 **CineTier**

> Film ve dizi tier listeleri yap, karşılaştır, paylaş. Topluluğun zevkini keşfet! 🍿

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

---

## ✨ Özellikler

| 🎯 | 🆚 | 📊 |
|---|---|---|
| **Tier List Builder** - Sürükle-bırak ile S/A/B/C/D tier'lar | **VS Modu** - İki film karşılaştır, Elo sıralaması | **Leaderboard** - En iyi oyuncuları gör |
| 🎬 **Film & Dizi Detayı** - TMDB'den canlı veri | 💬 **Yorumlar** - Threaded yapı, cevapla | 🔔 **Bildirimler** - Takip, beğeni, yorum |
| 👥 **Kişi Radar** - Oyuncu puanla (Acting, Charisma, Voice) | 💾 **Paylaş** - OG görsel, Twitter, link | 🎨 **Dark Mode** - Neon yeşil tema |

---

## 🚀 Başla

### 1️⃣ Repo'yu klonla
```bash
git clone https://github.com/waldseelen/CINETIER.git
cd CINETIER
npm install
```

### 2️⃣ Environment Değişkenlerini Ayarla

1. `.env.example` dosyasını `.env` olarak kopyala:
```bash
cp .env.example .env
```

2. Gerekli API anahtarlarını ekle:

#### 🔴 Zorunlu (Uygulama çalışmaz):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

#### 🟡 Önerilen (Demo modda çalışır):
- `TMDB_ACCESS_TOKEN` - TMDB API access token ([buradan alın](https://www.themoviedb.org/settings/api))
  - Yoksa: Demo modda 20 film + 20 dizi ile çalışır

#### 🟢 İsteğe Bağlı:
- `UPSTASH_REDIS_REST_URL` - Rate limiting için ([Upstash](https://upstash.com))
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `OMDB_API_KEY` - Ek rating bilgileri için ([OMDB](https://www.omdbapi.com/apikey.aspx))

**Not:** Uygulama başlatıldığında environment değişkenleri otomatik kontrol edilir ve eksik olanlar loglanır.

#### 📊 Rate Limit Bilgileri:
- **TMDB API:** 20 istek/saniye (otomatik rate limiting aktif)
- **Jikan API:** ~2.8 istek/saniye (MyAnimeList için, API key gerektirmez)
- **Upstash Redis:** İsteğe bağlı, gelişmiş rate limiting için

### 3️⃣ Supabase DB kur
Supabase SQL Editor'da sırayla:
```sql
-- db/migrations/001_initial_schema.sql
-- db/migrations/002_rls_policies.sql
-- db/migrations/003_person_ratings.sql
-- db/migrations/004_notifications.sql
```

### 4️⃣ Çalıştır
```bash
npm run dev
```
→ http://localhost:3000

---

## 🛠️ Tech Stack

| | |
|---|---|
| **Frontend** | Next.js 16 • TypeScript • Tailwind • shadcn/ui |
| **State** | TanStack Query • Framer Motion |
| **Backend** | Next.js API Routes • Supabase |
| **Auth & DB** | Supabase (PostgreSQL) |
| **API** | TMDB Trending, Search, Details |
| **Interactions** | dnd-kit (sürükle-bırak) • Recharts (radar) |

---

## 📍 Sayfalar

| Route | Açıklama |
|-------|----------|
| `/` | 🏠 Ana sayfa |
| `/explore` | 🔍 Trending filmler & diziler |
| `/create` | ➕ Yeni tier list oluştur |
| `/list/[slug]` | 📋 Tier list görüntüle |
| `/vs` | ⚔️ VS modu (karşılaştır) |
| `/leaderboard` | 🏆 Elo sıralaması |
| `/person/[tmdbId]` | ⭐ Kişi (oyuncu) detayı & puanla |
| `/notifications` | 🔔 Bildirimler |
| `/u/[username]` | 👤 Kullanıcı profili |

---

## 🧬 API Endpoints

```
GET  /api/tmdb/trending      → Trending filmler/diziler
GET  /api/tmdb/search        → TMDB araması
GET  /api/tmdb/media         → Film/Dizi detayı
GET  /api/vs/leaderboard     → Elo sıralaması
POST /api/notifications      → Bildirim listesi
POST /api/person-ratings     → Kişi puan kaydet
POST /api/reports            → İçerik şikayeti
POST /api/blocks             → Kullanıcı engelle
```

---

## 💡 Güzellikler

✅ **Otomatik Bildirimler** - DB trigger'ları (takip, like, yorum, yanıt)
✅ **OG Görsel Üretimi** - Twitter & Instagram için paylaş görseli
✅ **Threaded Yorumlar** - Cevapla, aç-kapa yapısı
✅ **Elo Algoritması** - VS sonuçlarından dinamik sıralama
✅ **Command Palette** - Cmd/Ctrl+K ile hızlı arama & navigasyon

---

## 📦 Deploy

**Vercel** en kolay yol:

1. Repoyu Vercel'e import et
2. `.env.local` değişkenlerini ekle
3. Deploy!

OG endpoint'leri Edge Runtime'da çalışır ✨

---

## 📄 Lisans

MIT - Açık kaynak, kullan istediğin gibi! 🎉

**[TMDB API](https://www.themoviedb.org)** kullanıyor - Atıf zorunlu ⚖️
