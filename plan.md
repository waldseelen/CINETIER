Aşağıdaki doküman “Copilot/’a ver → repo’yu sıfırdan üret” seviyesinde **tam güncellenmiş Product + Technical Spec**’tir. İçinde konsept, modüller, sayfalar, teknoloji yığını, repo yapısı, API tasarımı, **Postgres/Supabase SQL şeması + RLS + trigger** iskeleti ve geliştirme sırası var.

> Kapsam: **Film + Dizi + Anime**, **TierList (public/unlisted/private)**, **VS (Elo: global + user)**, **Watched + Watchlist (privacy)**, **Rating (10 üzerinden)**, **Short note + Long review**, **Like (tier list + comment + review)**, **Comment (tier list + media + review)**, **Follow + Feed (MVP)**, moderasyon ve paylaşılabilir görsel.

---

# 1) Ürün Konsepti (CineTier)

## 1.1 Vizyon
CineTier, kullanıcıların “ne izlediğini” kaydettiği bir yer değil; **zevkini görselleştirip yarıştırdığı** (tier + vs) ve **sosyal olarak sergilediği** bir platform.

## 1.2 USP (benzersiz değer)
1. **Tier Builder (drag-drop)**: paylaşılabilir, temalı, hızlı.
2. **VS (Elo)**: zevki ölçülebilir skorlarla çıkarır (global + kişisel).
3. **Sosyal katman**: follow + feed + like + yorum + review.
4. **Watchlist/Watches + puan + review**: Letterboxd benzeri günlükleme.

---

# 2) Modüller / Özellikler

## 2.1 Media (Film/Dizi/Anime)
- Kaynak: **TMDB**
- Media türleri: `movie`, `tv`
- Anime: teknik olarak TMDB “tv” içinde; UI’da “Anime” filtresi (genre/keywords/origin country + community tags).

**Media sayfası:**
- Watched toggle
- Watchlist toggle (privacy ayarlanabilir)
- Rating (0–10, 0.5 adım)
- Short note (kısa)
- Long review (uzun)
- Like/reply/comment alanı (media comments)
- “Bu media hangi tier listlerde var?” keşif

## 2.2 Tier Lists
- Template (S/A/B/C/D + renkler) + custom tier isimleri
- Drag & drop (dnd-kit)
- İçerik ekleme: TMDB search modal
- Visibility: **public / unlisted / private**
- Paylaşım:
  - public link (slug)
  - OG image / indirilebilir görsel

## 2.3 VS Modu (Elo)
- Mode: `global` ve `user` **ikisi birden**
- Kaynak havuzu:
  - tüm medya (trending / search tabanlı)
  - belirli bir tier list içindeki medyalarla VS

**Elo:**
- başlangıç 1200
- K-factor: 40 (ilk 20 maç), sonra 20
- her match kayıt altına alınır (audit + anti-spam)

## 2.4 Sosyal
- Follow/unfollow
- Feed (MVP): takip edilenlerin aktiviteleri
- Like:
  - tier list like
  - review like
  - comment like
- Comments:
  - tier list comments
  - media comments
  - review comments
  - (MVP’de reply opsiyonel; şema reply destekli tasarlanır)
- Notifications (P1 ama feed ile birlikte çok değerli)

## 2.5 Oyuncu Radar (Person ratings)
- Trait’ler: acting, charisma, voice, range
- Kullanıcı başına person değerlendirmesi
- Topluluk ortalaması (aggregate)

## 2.6 Moderasyon & Güvenlik
- report sistemi
- block sistemi
- RLS ile veri güvenliği
- rate limit (VS + comment spam)

---

# 3) Tech Stack (önerilen “production-grade”)

## Frontend
- **Next.js (App Router) + TypeScript**
- UI: **Tailwind CSS + shadcn/ui**
- State/Data: **TanStack Query** (server cache + invalidation)
- Drag&Drop: **dnd-kit**
- Forms: react-hook-form + zod
- Charts (radar): Recharts veya Chart.js
- Image export:
  - primary: **@vercel/og** ile server-side OG image
  - optional fallback: html-to-image (client export)

## Backend
- **Supabase**
  - Auth
  - Postgres + RLS
  - Storage (avatars, tierlist snapshots)
  - Edge Functions (opsiyonel) / Cron
- Next.js Route Handlers:
  - TMDB proxy (API key gizlemek + cache)
  - OG image render endpoint
  - rate limiting (Upstash Redis önerilir)

## External APIs
- **TMDB API** (zorunlu)
- OMDb (opsiyonel, sonra) – IMDb rating için

## Deployment
- Vercel (Next.js)
- Supabase (DB/Auth/Storage)

---

# 4) Repo / Kod Tabanı Yapısı (Copilot-friendly)

```
cinetier/
  app/
    (public)/
      page.tsx
      explore/page.tsx
      media/[type]/[tmdbId]/page.tsx
      u/[username]/page.tsx
      list/[slug]/page.tsx
      vs/page.tsx
      feed/page.tsx
      settings/page.tsx
    api/
      tmdb/search/route.ts
      tmdb/media/route.ts
      share/tierlist/[id]/og/route.ts
      vs/match/route.ts
  components/
    media/
    tier/
    vs/
    social/
    ui/ (shadcn)
  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    tmdb/
      tmdbClient.ts
      map.ts
    elo/
      elo.ts
    rateLimit/
      upstash.ts
    validators/
      schemas.ts
  db/
    migrations/ (supabase migrations)
    seed.sql
  types/
    supabase.ts (generated)
  middleware.ts
  next.config.ts
  tailwind.config.ts
  .env.example
```

---

# 5) Sayfalar (MVP’de hepsi var)

- `/` Home: trending + “Create Tier List” CTA + VS CTA
- `/explore`: public tier list keşfi + filtreler
- `/media/[type]/[tmdbId]`: media detay + watched/watchlist + rating + review + comments
- `/list/[slug]`: tier list view + like + comment + share + “VS this list”
- `/vs`: VS arena (global veya list-based)
- `/feed`: takip feed’i (MVP)
- `/u/[username]`: profil + watched/watchlist + listeler
- `/settings`: privacy defaults, block list, vs.

---




















Aşağıdaki plan, CineTier’ın **koyu yeşil tabanlı + turkuaz glow + neon fıstık yeşili** kimliğini “çok profesyonel, erişilebilir, akıcı” bir UI/UX’e dönüştürmek için **tasarım sistemi + sayfa düzenleri + komponent seti + animasyon dili + Tailwind/shadcn implementasyon notları** içerir. Copilot/Cursor’a direkt görev olarak da verilebilir.

---

# 1) UI/UX Tasarım Hedefleri (Non‑negotiables)
1) **Okunabilirlik & hız**: koyu temada glow kullan ama metin kontrastını asla düşürme.
2) **Erişilebilirlik**: klavye ile tam gezinme, belirgin focus ring, reduced motion desteği.
3) **Akıcılık**: loading skeleton + optimistic UI + mikro animasyonlar (hover, drag, like).
4) **Tutarlılık**: tek tip spacing (8pt grid), tek tip radius, tek tip gölge/glow token’ları.
5) **İçerik odaklı**: posterler ve tier grid “hero”; UI görsel olarak güçlü ama dikkat çalmayan.

---

# 2) Görsel Kimlik (Theme) – Renk Token’ları
Koyu yeşil arkaplan + neon yeşil primary + turkuaz accent glow.

## 2.1 Temel Palet (önerilen hex)
**Background (koyu yeşil):**
- `bg-0`: `#050B08` (en koyu)
- `bg-1`: `#07130E`
- `bg-2`: `#0B1F16` (surface)

**Surface / Card:**
- `surface-1`: `#0E2A1D`
- `surface-2`: `#123324`
- Border: `#1E4A34` (low-contrast border)

**Text:**
- Primary text: `#E9FFF4`
- Muted text: `#A7D6C1`
- Disabled: `#6E9B88`

**Primary (neon fıstık yeşili):**
- Primary: `#B8FF4A`
- Primary hover: `#9CFF1A`
- Primary pressed: `#7BE600`

**Accent (turkuaz glow):**
- Accent: `#00F5D4`
- Accent hover: `#00E6FF`

**Status:**
- Success: primary ailesiyle uyumlu
- Warning: `#FFD166`
- Danger: `#FF4D6D`

## 2.2 Gradient + Glow dili (marka hissi)
- Arkaplan: çok hafif **radial gradient** (turkuaz→şeffaf) + (neon yeşil→şeffaf) üst üste
- Glow sadece **etkileşimli** elementlerde artmalı (buton, dropzone, seçim, focus)

**Glow token’ları:**
- `glow-sm`: `0 0 12px rgba(0,245,212,.18)`
- `glow-md`: `0 0 24px rgba(0,245,212,.26)`
- `glow-xl`: `0 0 44px rgba(184,255,74,.18)`

---

# 3) Tipografi, Spacing, Radius
## 3.1 Tipografi
- Body: **Inter**
- Başlık/Display: **Space Grotesk** (modern, premium)
- Rakam/istatistik: Inter (tabular nums opsiyonel)

Ölçek:
- H1 40–48 / 700
- H2 28–32 / 700
- H3 20–24 / 600
- Body 14–16 / 400–500
- Caption 12–13

## 3.2 Layout sistemi
- **8pt grid** (spacing: 4/8/12/16/24/32/48)
- Radius:
  - sm: 10
  - md: 14
  - lg: 18
  - Poster/card: 16–18 (premium his)

---

# 4) Komponent Sistemi (shadcn/ui + Radix tabanlı)
Bu ürün için “komponent kontratı” net olmalı; her parça aynı tasarım dilini konuşmalı.

## 4.1 Temel komponentler (MVP)
- AppShell: Top nav + (mobile) bottom nav
- Button (primary/neon, secondary, ghost)
- Input / Search (debounced + clear)
- Command Palette (Cmd/Ctrl+K arama) (çok premium his verir)
- Card / Surface
- Tabs (Profile: watched/watchlist/lists/reviews)
- Badge/Chip (media_type, visibility, spoiler)
- Tooltip / Popover
- Dialog/Drawer (mobile için drawer şart)
- Toast (like, saved, copied link)
- Skeleton loaders
- Pagination / Infinite scroll

## 4.2 CineTier özel komponentler
- **PosterCard**: hover’da hafif lift + turkuaz edge glow
- **TierBoard**: tier column + dropzone glow + reorder animasyonu
- **TierItem (poster chip)**: drag handle + quick actions (remove, note)
- **VSCard**: iki büyük poster + swipe/keyboard (← →) seçimi
- **ActivityItem**: feed satırı (avatar + action + mini poster)
- **ReviewCard**: uzun metin + spoiler blur + like/comment
- **VisibilityPill**: public/unlisted/private

---

# 5) Etkileşim ve Animasyon Planı (profesyonel “motion language”)
## 5.1 Kütüphane
- **Framer Motion** (page transitions + micro animations)
- dnd-kit’in animasyonlarını hafif motion ile destekle

## 5.2 Motion token’ları (standartlaştır)
- Duration:
  - fast: 120ms
  - normal: 180ms
  - slow: 260ms
- Easing: `cubic-bezier(.2,.8,.2,1)` (snappy)

## 5.3 Nerelerde animasyon olacak?
- Hover: `translateY(-2px)`, glow intensity +10–20%
- Button: pressed state scale `0.98`
- Modal/Drawer: fade + slide (8–12px)
- Skeleton shimmer: çok hafif (gözü yormasın)
- Tier drag:
  - Dropzone’a girince border + glow
  - Item bırakınca “settle” animasyonu
- VS:
  - seçilen kart “pop” + karşı taraf hafif blur/fade
  - keyboard + swipe desteği (mobilde çok iyi his verir)
- Like:
  - ikon bounce (minimal)
  - sayının artışı smooth

## 5.4 Reduced motion (erişilebilirlik)
- `prefers-reduced-motion` → animasyonları minimuma indir, sadece opacity kullan.

---

# 6) Erişilebilirlik (A11y) Checklist (çok önemli)
- Kontrast: metin en az WCAG AA hedefle
- Tüm interaktifler:
  - klavye ile erişilebilir
  - `focus-visible` ring: **turkuaz + 2px** (net)
- Drag&Drop için:
  - klavye reorder desteği (dnd-kit mümkün)
  - en azından “Move up/down” alternatif kontroller (MVP’de opsiyonel ama iyi)
- Form hataları: sadece renk değil ikon + metin
- Spoiler içerik: blur + “show spoiler” butonu

---

# 7) Sayfa Bazlı UI Planı (akıcı ve kullanıcı dostu)
## 7.1 App Shell
- Desktop: üstte sticky nav (logo, search, create, vs, feed, profile)
- Mobile: bottom nav (Home / Explore / VS / Create / Profile) + üstte search ikon

## 7.2 Home
- Hero: “Create Tier List” + “Start VS”
- Trending grid (PosterCard)
- Son public listeler (mini tier preview)

## 7.3 Media Detail
- Sol: poster + quick actions (watched/watchlist/rate)
- Sağ: tabs (Overview / Reviews / Comments / In Tier Lists)
- Watched seçilince rating ve short note alanı “smooth expand”

## 7.4 Tier Builder
- Üst: title + visibility + save + share
- Sol: “Add items” (search modal / command palette)
- Orta: TierBoard
- Sağ: (opsiyonel) inspector panel (seçilen item note, remove)

## 7.5 VS
- Full-screen iki kart
- Alt: “skip” + “this list scope” pill
- Üst: scope toggle (Global / You)
- Keyboard hint: (↔) / (A-D) kısayollar (power user hissi)

## 7.6 Feed
- ActivityItem listesi (infinite scroll)
- Filtre: only watched / only lists / only reviews

## 7.7 Profile
- Header: avatar + follow button (başkasıysa) + istatistik
- Tabs: Watched / Watchlist / Tier Lists / Reviews
- Privacy saygısı: private watchlist ise kilit ikon + açıklama

---

# 8) Tailwind + shadcn ile Tema Uygulaması (implementasyon planı)
## 8.1 Yaklaşım
- shadcn’in CSS variable tabanlı theme yapısını kullan
- `globals.css` içinde “CineTier Dark” değişkenlerini tanımla
- Tailwind’de `boxShadow`, `keyframes`, `animation` genişlet

## 8.2 Örnek `globals.css` (tema fikri)
- `:root` veya `.dark` altında:
  - `--background`, `--foreground`, `--primary`, `--accent`, `--border`…
- Arkaplan için:
  - `background: radial-gradient(...turquoise...) , radial-gradient(...neon green...) , #050B08;`

## 8.3 Tailwind config’e eklenecekler
- `boxShadow: { glowSm, glowMd, glowXl }`
- `keyframes: { float, shimmer, pop }`
- `animation: { float: 'float 6s ease-in-out infinite' ... }`

> Copilot’a görev: “CineTierTheme tokens” dosyası oluşturup tüm komponentlerde aynı token’ları kullandır.

---

# 9) UI Kalite Standartları (profesyonel his için)
- Boş durumlar (empty states): “Add your first movie” + tek CTA
- Hata durumları: retry + açıklayıcı metin
- Loading: skeleton + optimistic updates
- Görsel bütünlük:
  - posterlerde aynı radius
  - grid hizaları tutarlı
  - hover/focus davranışı her yerde aynı

---










































