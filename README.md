# CineTier

CineTier; film, dizi ve kişileri (oyuncu/yönetmen vb.) keşfetmeyi, tier listeleri oluşturmayı, VS modunda karşılaştırmayı ve topluluk etkileşimiyle zevk haritası çıkarmayı hedefleyen bir web uygulamasıdır.

Bu repo; Next.js App Router, Supabase (Auth + Postgres), TMDB entegrasyonu ve shadcn/ui (Radix primitives) ile geliştirilmiştir.

## İçerik

- [Özellikler](#özellikler)
- [Sayfalar ve API uçları](#sayfalar-ve-api-uçları)
- [Tech Stack](#tech-stack)
- [Kurulum](#kurulum)
- [Veritabanı / Migrations](#veritabanı--migrations)
- [Geliştirme notları](#geliştirme-notları)
- [Deploy](#deploy)

## Özellikler

### Kimlik doğrulama ve profil

- Supabase Auth ile kayıt/giriş/şifre sıfırlama.
- Kullanıcı profili (kullanıcı adı, görünen ad, avatar) ve profil sayfası.

### Keşif (TMDB)

- TMDB trending, arama ve detay sayfaları.
- Film/Dizi detaylarında temel meta: poster, arka plan, türler, özet, puan ortalaması.
- Sunucu tarafında istenirse “media” önbellekleme: TMDB’den çekilen içerik verisi Supabase’e upsert edilir (service role key mevcutsa).

### Tier List Builder

- S/A/B/C/D gibi tier’lar ile sürükle-bırak (dnd-kit) düzenleyici.
- Liste oluşturma / güncelleme / görüntüleme.
- Liste sayfasında paylaşım diyalogu:
   - Link kopyalama
   - Twitter paylaşımı
   - Görsel indirme (OG üretimi üzerinden)

### OG Image (Paylaşım görseli)

- Tier listeler için otomatik OG görsel üretimi.
- Twitter ve Instagram gibi farklı format preset’leri.
- Endpoint: `/api/share/tierlist/[id]/og`

### VS Modu (karşılaştırma) + Elo

- İki içerik arasında hızlı seçim akışı.
- Sonuçlar Elo mantığı ile skorlanır ve sıralama/leaderboard üretilir.
- Liste bazlı VS modu: `?list=slug` parametresiyle belirli bir tier list’in öğelerinden matchup üretilebilir.

### Leaderboard

- Global veya kullanıcı bazlı sıralama görünümü.
- Medya tipi filtreleme (film/dizi).
- Sayfa: `/leaderboard`
- API: `/api/vs/leaderboard`

### Sosyal etkileşim

- Takip etme.
- Beğeni (tier list / review).
- Yorumlar:
   - Threaded yapı (cevap verme / alt yorumlar)
   - “Daha fazla göster” benzeri aç-kapa akışı
   - Kullanıcının kendi yorumunu silebilmesi

### Bildirimler

- Takip/like/yorum/yanıt olayları için bildirim üretimi.
- Veritabanında trigger’lar ile otomatik bildirim oluşturma.
- Navbar bildirim zili (unread sayacı + dropdown) ve ayrı bildirim sayfası.
- API: bildirimleri listeleme ve okundu işaretleme.

### Moderasyon: şikayet ve engelleme

- İçerik şikayet akışı (neden seçimi + gönderim).
- Kullanıcı engelleme/engeli kaldırma.

### Kişi (Person) radar puanlama

- TMDB person araması ve person sayfası.
- Trait bazlı puanlama: acting, charisma, voice, range.
- Topluluk ortalaması ve kullanıcı puanı.
- DB: `persons`, `person_ratings`, `person_aggregate_ratings` view.

### Command Palette (Cmd/Ctrl+K)

- Global komut paleti (cmdk): hızlı sayfa navigasyonu + TMDB araması.
- Layout’a entegre, klavye kısayolu ile açılır.

## Sayfalar ve API uçları

### Sayfalar

- `/` Ana sayfa
- `/explore` Keşif
- `/search` Arama
- `/media/[type]/[tmdbId]` Medya detay
- `/create` Tier list oluşturma
- `/list/[slug]` Tier list sayfası
- `/vs` VS modu (opsiyonel `?list=slug`)
- `/leaderboard` VS sıralaması
- `/notifications` Bildirimler
- `/person/[tmdbId]` Kişi (Person) sayfası
- `/u/[username]` Profil
- `/settings` Ayarlar
- `/auth/*` Auth akışları (login/signup/forgot/verify/callback)

### API routes

- `/api/tmdb/search` TMDB arama
- `/api/tmdb/trending` TMDB trending
- `/api/tmdb/media` TMDB media detay + opsiyonel DB cache
- `/api/tmdb/person` TMDB person arama/detay
- `/api/share/tierlist/[id]/og` OG görsel üretimi
- `/api/vs` VS match sonucu / Elo güncellemesi (repo içindeki mevcut implementasyona göre)
- `/api/vs/leaderboard` Leaderboard verisi
- `/api/notifications` Bildirim listele/okundu işaretle
- `/api/reports` Şikayet gönderimi
- `/api/blocks` Engelle/engeli kaldır
- `/api/person-ratings` Kişi puan CRUD
- `/api/activities` Aktivite/Feed (repo içindeki implementasyona göre)

## Tech Stack

- Framework: Next.js 16 (App Router)
- Dil: TypeScript
- UI: Tailwind CSS + shadcn/ui (Radix UI)
- State / Data: TanStack Query
- Auth + DB: Supabase (PostgreSQL) + `@supabase/ssr`
- Animasyon: Framer Motion
- DnD: dnd-kit
- Form: react-hook-form + Zod
- Charts: Recharts (Person radar grafikleri)
- OG: `@vercel/og` / `next/og`
- Toast: sonner

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya pnpm
- Supabase projesi
- TMDB API erişimi

### 1) Bağımlılıkları yükle

```bash
cd cinetier
npm install
```

### 2) Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun.

```bash
copy .env.example .env.local
```

Gerekli değişkenler:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=

# TMDB
TMDB_API_KEY=
TMDB_ACCESS_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# (Opsiyonel) Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Notlar:

- `SUPABASE_SERVICE_ROLE_KEY` sadece server-side (API routes) kullanılmalıdır. Client’a asla sızmamalı.
- `UPSTASH_*` opsiyoneldir; boş bırakılabilir.

### 3) Supabase veritabanı kur

Supabase Dashboard → SQL Editor’da sırayla çalıştırın:

1. `db/migrations/001_initial_schema.sql`
2. `db/migrations/002_rls_policies.sql`
3. `db/migrations/003_person_ratings.sql`
4. `db/migrations/004_notifications.sql`

### 4) Geliştirme sunucusu

```bash
npm run dev
```

Uygulama: http://localhost:3000

## Veritabanı / Migrations

Bu projede veritabanı şeması SQL migration dosyalarıyla tutulur:

- `001_initial_schema.sql`: temel tablolar (media, tier list, yorumlar, vs)
- `002_rls_policies.sql`: RLS ve policy setleri
- `003_person_ratings.sql`: person cache + radar puan sistemi
- `004_notifications.sql`: notifications tablosu + trigger bazlı otomasyon

Bildirimler trigger’lar ile otomatik üretilir:

- Follow → `follow` bildirimi
- Tier list like → `like_tier_list` bildirimi
- Review like → `like_review` bildirimi
- Yorum → `comment` bildirimi
- Yanıt → `reply` bildirimi

## Geliştirme notları

### Script’ler

- `npm run dev`: geliştirme
- `npm run build`: production build
- `npm run start`: production server
- `npm run lint`: lint
- `npm run db:generate`: Supabase TypeScript types üretimi

### Supabase type generation (Windows / PowerShell)

`db:generate` script’i environment variable kullanır. PowerShell’de örnek:

```powershell
$env:SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"; npm run db:generate
```

### Middleware notu

Next.js 16 ile “middleware” dosya konvansiyonu bazı kurulumlarda “proxy” yaklaşımına yönlendiriliyor. Repo `middleware.ts` içeriyor; Next.js uyarısı görürseniz dokümantasyondaki yönlendirmeyi takip edebilirsiniz.

## Deploy

En kolay yol Vercel’dir:

1. Projeyi Vercel’e import edin.
2. Environment Variables bölümüne `.env.local` değişkenlerini girin.
3. Deploy edin.

OG görselleri ve bazı API endpoint’leri Edge/Server runtime kullanabilir; Vercel üzerinde sorunsuz çalışacak şekilde tasarlanmıştır.

## Lisans

MIT

## Yasal / Atıf

Bu ürün TMDB API kullanır. TMDB içeriklerinin kullanım koşulları ve atıf gereksinimleri için TMDB şartlarını inceleyin.
