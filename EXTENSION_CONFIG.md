# Extension Configuration

## Setup

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
node generate-config.js
```

File `config.js` akan ter-generate otomatis di:
- `ext-local/config.js`
- `ext-prod/config.js`
- `ext-qa/config.js`

## Configuration Options

### API_BASE_URL
Base URL untuk Loomo web application.
- Development: `http://localhost:8999`
- Production: `https://your-domain.com`

### MAX_RECORDING_MINUTES
Maximum durasi recording sebelum auto-stop (dalam menit).
- Default: `4`
- Tidak ada batasan file size untuk upload (menggunakan resumable upload ke Google Drive)

### WARNING_RECORDING_MINUTES
Durasi kapan warning muncul (dalam menit).
- Default: `2`
- Harus lebih kecil dari `MAX_RECORDING_MINUTES`

### DEBUG
Mode debug untuk console logs.
- `true`: Semua console logs aktif
- `false`: Console logs disabled (kecuali error)
- Recommended: `true` untuk development, `false` untuk production

## Notes

- File `config.js` di-generate otomatis, **jangan edit manual**
- Setiap kali ubah `.env.extension`, jalankan `node generate-config.js`
- File `.env.extension` sudah masuk `.gitignore` (tidak di-commit ke repo)
- File `.env.extension.example` adalah template dan di-commit ke repo
