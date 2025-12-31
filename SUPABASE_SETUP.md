# 🔧 Supabase Kurulum Rehberi

## 1️⃣ Supabase Projesi Oluştur

1. **[supabase.com](https://supabase.com)** adresine git ve ücretsiz hesap oluştur
2. "New Project" butonuna tıkla
3. Proje bilgilerini doldur:
   - **Project Name:** CINETIER (veya istediğin isim)
   - **Database Password:** Güçlü bir şifre oluştur (kaydet!)
   - **Region:** Size en yakın bölge
4. "Create new project" butonuna tıkla (1-2 dakika sürer)

## 2️⃣ API Anahtarlarını Al

Proje oluştuktan sonra:

1. Sol menüden **Settings** → **API** bölümüne git
2. Şu bilgileri kopyala:

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://[proje-id].supabase.co

# anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (GÖSTERİLMEYEN ALANA TIKLA)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **service_role key'i gizli tut - bu admin yetkisi verir!**

## 3️⃣ Veritabanı Şemasını Kur

1. Sol menüden **SQL Editor** bölümüne git
2. "New query" butonuna tıkla
3. Aşağıdaki dosyaları sırayla çalıştır:

### Adım 1: Temel Şema
`db/migrations/001_initial_schema.sql` dosyasının içeriğini kopyala ve çalıştır (RUN butonu)

### Adım 2: RLS Policies
`db/migrations/002_rls_policies.sql` dosyasının içeriğini kopyala ve çalıştır

### Adım 3: Person Ratings
`db/migrations/003_person_ratings.sql` dosyasının içeriğini kopyala ve çalıştır

### Adım 4: Notifications
`db/migrations/004_notifications.sql` dosyasının içeriğini kopyala ve çalıştır

### Adım 5: External Ratings (Anime)
`db/migrations/005_external_ratings_anime.sql` dosyasının içeriğini kopyala ve çalıştır

## 4️⃣ .env Dosyasını Güncelle

Projenin `.env` dosyasını aç ve kopyaladığın bilgilleri yapıştır:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[senin-proje-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[senin-anonkey]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[senin-servicekey]
SUPABASE_PROJECT_ID=[senin-proje-id]
```

## 5️⃣ Testi

Terminal'de:

```bash
npm run dev
```

Artık Supabase bağlantısı çalışıyor! 🎉

## 🔒 Güvenlik Notları

- ✅ `.env` dosyası `.gitignore`'da olmalı (varsayılan olarak var)
- ❌ `service_role` key'i asla public repoya yükleme
- ✅ RLS (Row Level Security) policies aktif olmalı
- ✅ Supabase'in "Auth" ayarlarını kontrol et (Email, OAuth vs.)

## 📋 Opsiyonel: Type Generation

TypeScript tipleri otomatik oluşturmak için:

```bash
npm run db:generate
```

Bu komut `types/supabase.ts` dosyasını güncelleyecek.

---

**Sorun mu var?**
- Supabase Dashboard'da "Table Editor" bölümünden tabloları kontrol et
- SQL Editor'de hata mesajlarını oku
- `.env` dosyasında URL ve key'leri kontrol et
