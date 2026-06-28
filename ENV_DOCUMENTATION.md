# Environment Variables Documentation

## 📁 File Overview

| File | Location | Purpose | Committed to Git? |
|------|----------|---------|-------------------|
| `.env.extension.example` | Root | Template untuk extension config | ✅ Yes |
| `.env.extension` | Root | Extension config (aktual) | ❌ No (gitignored) |
| `web/.env.example` | web/ | Template untuk web app | ✅ Yes |
| `web/.env` | web/ | Web app config local dev | ❌ No (gitignored) |
| `web/.env.production` | web/ | Web app config production (Vercel) | ❌ No (gitignored) |

---

## 1️⃣ Extension Configuration (`.env.extension`)

**File:** `.env.extension` (root directory)
**Template:** `.env.extension.example`

### Variables:

```env
# API Base URL - URL web application
API_BASE_URL=http://localhost:8999

# Recording Configuration (dalam menit)
MAX_RECORDING_MINUTES=4          # Max duration sebelum auto-stop
WARNING_RECORDING_MINUTES=2      # Kapan warning muncul

# Debug Mode
DEBUG=true                       # true = console log aktif, false = disabled
```

### Setup:
```bash
cp .env.extension.example .env.extension
# Edit sesuai environment
npm run config:generate
```

### Environment Values:

| Environment | API_BASE_URL | MAX_RECORDING_MINUTES | DEBUG |
|-------------|--------------|------------------------|-------|
| Local | `http://localhost:8999` | 4-10 | true |
| QA | `https://qa.loomo.my.id` | 4 | false |
| Production | `https://loomo.my.id` | 4 | false |

---

## 2️⃣ Web Application Configuration (`web/.env`)

**File:** `web/.env` (untuk local development)
**Template:** `web/.env.example`

### Variables:

```env
# Database
DATABASE_URL="postgresql://postgres:admin123@127.0.0.1:5432/loomo_db?schema=public"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:8999"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-32-byte-encryption-key-here"

# Cron Job Secret
CRON_SECRET="your-cron-secret-hex"

# Storage
DEFAULT_SAVE_TO_OWNER_DRIVE=true

# Upload Limit
MAX_UPLOAD_SIZE_MB=100
```

### Setup Local Development:
```bash
cd web
cp .env.example .env
# Edit DATABASE_URL, GOOGLE_CLIENT_ID, etc.
npm run dev
```

---

## 3️⃣ Production Configuration (Vercel)

**File:** `web/.env.production` (auto-generated oleh Vercel)

### Setup di Vercel Dashboard:

1. Go to: `https://vercel.com/[team]/loomo-app/settings/environment-variables`

2. Tambahkan variables untuk **Production**:

```
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_APP_URL=https://loomo.my.id
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx
CRON_SECRET=xxx
DEFAULT_SAVE_TO_OWNER_DRIVE=true
```

3. Untuk **QA environment** (jika ada):
```
NEXT_PUBLIC_APP_URL=https://qa.loomo.my.id
```

---

## 🔒 Security Notes

### Secrets yang WAJIB diganti:

1. **JWT_SECRET** - Generate:
   ```bash
   openssl rand -base64 32
   ```

2. **ENCRYPTION_KEY** - Generate 32 bytes:
   ```bash
   openssl rand -hex 32
   ```

3. **CRON_SECRET** - Generate:
   ```bash
   openssl rand -hex 32
   ```

4. **GOOGLE_CLIENT_ID & SECRET** - Dari Google Cloud Console

---

## 📋 Checklist Setup

### Local Development:
- [ ] Copy `web/.env.example` → `web/.env`
- [ ] Setup PostgreSQL lokal
- [ ] Update `DATABASE_URL` di `web/.env`
- [ ] Copy `.env.extension.example` → `.env.extension`
- [ ] Run `npm run config:generate`
- [ ] Run `cd web && npm run dev`

### Production Deployment:
- [ ] Set environment variables di Vercel Dashboard
- [ ] Copy `.env.extension.example` → `.env.extension`
- [ ] Edit `.env.extension` (set production URL, DEBUG=false)
- [ ] Run `npm run ext:build`
- [ ] Commit & push
- [ ] Vercel auto-deploy

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| Generate extension config | `npm run config:generate` |
| Build extension (prod) | `npm run ext:build` |
| Build extension (all env) | `npm run ext:build:all` |
| Run web dev | `cd web && npm run dev` |
| Build web | `cd web && npm run build` |

---

## ❓ FAQ

**Q: Kenapa ada 2 file .env terpisah?**
A: `.env.extension` untuk config Chrome Extension, `web/.env` untuk Next.js web app.

**Q: Apakah .env.extension perlu di-commit?**
A: Tidak. Hanya `.env.extension.example` yang di-commit sebagai template.

**Q: Bagaimana cara ganti max recording duration?**
A: Edit `MAX_RECORDING_MINUTES` di `.env.extension`, lalu run `npm run ext:build`.

**Q: Vercel limit 10 detik, apakah video 4 menit bisa diupload?**
A: Ya, karena extension pakai **resumable upload** langsung ke Google Drive (tidak lewat server Vercel).
