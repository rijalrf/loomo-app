# Environment Variables - Simplified

## 📁 File yang Dipakai

```
loomo-app/
├── .env.extension          ← Extension config (gitignored)
├── .env.extension.example  ← Template extension (committed)
└── web/
    ├── .env                ← Web app config (gitignored)
    └── .env.example        ← Template web app (committed)
```

**HANYA 2 FILE `.env` YANG DIPAKAI:**
1. **`.env.extension`** - Config untuk Chrome Extension
2. **`web/.env`** - Config untuk Next.js Web App

---

## 1️⃣ Extension Config (`.env.extension`)

**Lokasi:** Root folder  
**Template:** `.env.extension.example`

### Setup:
```bash
cp .env.extension.example .env.extension
```

### Isi file:
```env
# URL web application
API_BASE_URL=http://localhost:8999

# Max recording duration (menit)
MAX_RECORDING_MINUTES=4
WARNING_RECORDING_MINUTES=2

# Debug mode (true/false)
DEBUG=true
```

### Nilai per Environment:

| Environment | API_BASE_URL | DEBUG |
|-------------|--------------|-------|
| Local | `http://localhost:8999` | `true` |
| Production | `https://loomo.my.id` | `false` |

**Generate config:** `npm run config:generate`

---

## 2️⃣ Web App Config (`web/.env`)

**Lokasi:** `web/` folder  
**Template:** `web/.env.example`

### Setup:
```bash
cd web
cp .env.example .env
```

### Isi file:
```env
# Database (PostgreSQL local)
DATABASE_URL="postgresql://postgres:admin123@127.0.0.1:5432/loomo_db"

# Google OAuth (dari Google Cloud Console)
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:8999"

# Security (generate pakai openssl)
JWT_SECRET="xxx"
ENCRYPTION_KEY="xxx"
CRON_SECRET="xxx"

# Storage
DEFAULT_SAVE_TO_OWNER_DRIVE=true
```

### Generate Secrets:
```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key (32 bytes)
openssl rand -hex 32

# Cron Secret
openssl rand -hex 32
```

---

## 🚀 Production (Vercel)

**Untuk production, TIDAK pakai file `.env`!**

Set langsung di Vercel Dashboard:
1. Go to: `https://vercel.com/[team]/loomo-app/settings/environment-variables`
2. Tambahkan semua variable dari `web/.env.example`
3. Ganti dengan nilai production (database, URL, secrets)

**Production values:**
```
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=xxx
NEXT_PUBLIC_APP_URL=https://loomo.my.id
# ... (set semua variable lainnya)
```

---

## ✅ Checklist Setup

### Local Development:
```bash
# 1. Setup web app
cd web
cp .env.example .env
# Edit .env (database, Google OAuth, dll)

# 2. Setup extension
cd ..
cp .env.extension.example .env.extension
# Edit jika perlu (default sudah OK)

# 3. Generate extension config
npm run config:generate

# 4. Run dev server
cd web
npm run dev
```

### Production Deployment:
```bash
# 1. Set variables di Vercel Dashboard
# 2. Edit .env.extension (set production URL, DEBUG=false)
# 3. Push ke GitHub
# 4. Vercel auto-deploy (extension otomatis ter-generate)
```

---

## 🎯 Quick Commands

```bash
npm run config:generate    # Generate extension config dari .env.extension
npm run ext:build          # Build extension package (prod)
cd web && npm run dev      # Run web app development server
cd web && npm run build    # Build web app (auto-build extension juga)
```

---

## ❓ FAQ

**Q: Kenapa ada 2 file .env terpisah?**  
A: `.env.extension` untuk Chrome Extension config, `web/.env` untuk Next.js web app config.

**Q: File .env mana yang harus di-commit?**  
A: **JANGAN commit .env apapun!** Hanya commit `.example` files sebagai template.

**Q: Bagaimana cara production pakai .env?**  
A: **TIDAK pakai .env di production!** Set environment variables langsung di Vercel Dashboard.

**Q: Kenapa extension perlu .env sendiri?**  
A: Chrome Extension tidak bisa akses environment variables dari Next.js. Butuh file config.js yang di-generate dari .env.extension.
