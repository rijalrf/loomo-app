# Struktur Folder Proyek Loomo App

## 1. Root Directory
- `README.md`: Dokumentasi proyek.
- `.gitignore`: File untuk menentukan file atau folder yang diabaikan oleh Git.

## 2. .vercel/
- `repo.json`: Konfigurasi repository untuk Vercel.
- `project.json`: Informasi proyek di Vercel.
- `README.txt`: Dokumentasi terkait Vercel.

## 3. docs/
- `REFACTORING_COMPLETED.md`: Catatan tentang refactoring yang telah diselesaikan.
- `PRD.md`: Dokumen tentang Product Requirements Document.
- `COLORUI.md.old`: File lama terkait UI warna.

## 4. ext-local/
- File konfigurasi dan script untuk ekstensi lokal:
  - `config.js`: Konfigurasi ekstensi.
  - `manifest.json`: Deskripsi ekstensi.
  - `popup.html`: HTML untuk popup ekstensi.
  - File JavaScript lainnya untuk menjalankan fungsionalitas ekstensi.

## 5. ext-prod/
- File yang sama dengan `ext-local`, tetapi untuk produksi.

## 6. web/
- Folder utama untuk aplikasi web:
  - `package-lock.json`: Menyimpan versi pasti dari setiap paket node.
  - `next.config.ts`: Konfigurasi untuk aplikasi Next.js.
  - `prisma.config.ts`: Konfigurasi untuk Prisma.
  - Berbagai file di subdirektori (`components`, `constants`, `generated`, dll) untuk komponen UI, konstanta, dan model Prisma.

## 7. web/prisma/
- `schema.prisma`: Skema database Prisma.

## 8. web/public/
- Gambar dan file publik untuk aplikasi web.

## 9. web/src/components/
- Komponen utama aplikasi web:
  - `CallbackRedirect.tsx`, `Sidebar.tsx`, dll: Berbagai komponen UI.

## 10. web/src/constants/
- `themes.ts`: Definisi tema.

## 11. web/src/generated/
- File yang dihasilkan secara otomatis oleh Prisma untuk model dan tipe input.

## 12. web/src/hooks/
- Hook kustom yang digunakan dalam aplikasi.

## 13. web/src/lib/
- Library dan utilitas umum yang digunakan di seluruh aplikasi.

