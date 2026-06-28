# Extension Configuration & Build

## Setup Configuration

1. Copy `.env.extension.example` to `.env.extension`:
```bash
cp .env.extension.example .env.extension
```

2. Edit `.env.extension` sesuai kebutuhan:
```env
API_BASE_URL=http://localhost:8999
MAX_RECORDING_MINUTES=4
WARNING_RECORDING_MINUTES=2
DEBUG=true
```

3. Generate config files untuk extension:
```bash
npm run config:generate
```

File `config.js` akan ter-generate otomatis di:
- `ext-local/config.js`
- `ext-prod/config.js`
- `ext-qa/config.js`

## Build Extension Package

### Build untuk environment tertentu:

```bash
# Production (default)
npm run ext:build

# Local development
npm run ext:build:local

# QA environment
npm run ext:build:qa

# Build semua environment
npm run ext:build:all
```

Output file:
- `web/public/loomo-extension-prod.zip`
- `web/public/loomo-extension-local.zip`
- `web/public/loomo-extension-qa.zip`
- `web/public/loomo-extension.zip` (symlink ke prod)

### Manual build:

```bash
node generate-config.js
node build-extension.js [prod|local|qa]
```

## Download Extension dari Website

User dapat download extension dari website dengan URL:
- Production: `https://your-domain.com/loomo-extension.zip`
- Local: `http://localhost:8999/loomo-extension-local.zip`
- QA: `https://qa.your-domain.com/loomo-extension-qa.zip`

Extension yang di-download sudah ter-configure sesuai environment.

## Configuration Options

### API_BASE_URL
Base URL untuk Loomo web application.
- Development: `http://localhost:8999`
- QA: `https://qa.loomo.my.id`
- Production: `https://loomo.my.id`

### MAX_RECORDING_MINUTES
Maximum durasi recording sebelum auto-stop (dalam menit).
- Default: `4`
- Tidak ada batasan file size untuk upload (menggunakan resumable upload ke Google Drive)
- Rekomendasi: 4-20 menit untuk performa optimal

### WARNING_RECORDING_MINUTES
Durasi kapan warning muncul (dalam menit).
- Default: `2`
- Harus lebih kecil dari `MAX_RECORDING_MINUTES`

### DEBUG
Mode debug untuk console logs.
- `true`: Semua console logs aktif
- `false`: Console logs disabled (kecuali error)
- Recommended: `true` untuk development, `false` untuk production

## Workflow untuk Update Config

1. Edit `.env.extension`
2. Run `npm run ext:build`
3. Deploy web app (zip baru sudah ada di `web/public/`)
4. User download extension terbaru dari website

## Notes

- File `config.js` di-generate otomatis, **jangan edit manual**
- Setiap kali ubah `.env.extension`, jalankan `npm run ext:build`
- File `.env.extension` sudah masuk `.gitignore` (tidak di-commit ke repo)
- File `.env.extension.example` adalah template dan di-commit ke repo
- Extension package otomatis di-generate saat build
