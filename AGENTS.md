# AGENTS.md - Aturan untuk AI Agent

## Aturan UI/UX

### Loading Alert

Setiap kali ada action atau navigasi, tampilkan alert loading menggunakan komponen `LoadingAlert` atau helper function `showLoadingAlert()` / `hideLoadingAlert()`. Alert harus muncul saat proses loading dan hilang saat proses selesai. Gunakan komponen yang sudah ada di proyek ini, jangan gunakan `alert()` dari JavaScript murni.

#### Cara Penggunaan:

**1. Menggunakan Komponen `LoadingAlert` (untuk state-based loading):**
```tsx
import LoadingAlert from '@/components/LoadingAlert';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await someAsyncAction();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingAlert isLoading={isLoading} message="Processing..." />
      <button onClick={handleAction}>Submit</button>
    </>
  );
}
```

**2. Menggunakan Helper Function (untuk action langsung):**
```tsx
import { showLoadingAlert, hideLoadingAlert } from '@/components/LoadingAlert';

const handleSave = async () => {
  const loadingId = showLoadingAlert('Saving data...');
  try {
    await saveData();
    hideLoadingAlert(loadingId);
    toast.success('Data saved successfully');
  } catch (error) {
    hideLoadingAlert(loadingId);
    toast.error('Failed to save data');
  }
};
```

**3. Untuk navigasi (menggunakan useRouter):**
```tsx
import { showLoadingAlert, hideLoadingAlert } from '@/components/LoadingAlert';
import { useRouter } from 'next/navigation';

const router = useRouter();

const handleNavigate = () => {
  showLoadingAlert('Loading page...');
  router.push('/dashboard');
};
```

Pastikan untuk menghilangkan alert setelah proses selesai dengan `hideLoadingAlert()` atau mengatur state `isLoading` menjadi `false`.

### Cursor Pointer
Semua elemen yang memiliki aksi interaktif (button, link, clickable element) **WAJIB** memiliki `cursor: pointer` atau `cursor-pointer` class.

Contoh elemen yang harus memiliki cursor pointer:
- Button (termasuk icon button)
- Link
- Clickable text/title
- Icon yang bisa diklik (edit, delete, share, close)
- Card yang bisa diklik
- Dropdown toggle
- Tab navigation
- Modal close button "X"

### PopupModal Component
Komponen `PopupModal` adalah komponen reusable minimal yang hanya menyediakan:
- Container modal dengan backdrop blur
- Icon close "X" di pojok kanan atas (dengan `cursor-pointer`)
- Props: `isOpen`, `onClose`, `children`, `maxWidth`

**Cara penggunaan:**
- Yang menggunakan `PopupModal` harus mengisi konten (title, message, buttons, form) via `children`
- Semua button di dalam modal harus memiliki `cursor-pointer`
- Icon/element interaktif di dalam modal harus memiliki `cursor-pointer`

### Animasi
- PopupModal sudah memiliki animasi bawaan: `animate-in fade-in zoom-in-95 duration-300`
- Button interaktif gunakan hover effect seperti `-translate-y-0.5` atau perubahan warna
- **ATURAN KHUSUS MODAL/POPUP BUTTONS:** Untuk tombol aksi di dalam popup modal (seperti 'Move', 'Delete', 'Cancel', atau tombol submit form di dalam modal), **DILARANG** menggunakan animasi hover yang menggeser posisi elemen (seperti `hover:-translate-y-0.5` atau efek transform translate lainnya). Cukup gunakan transisi warna latar belakang (background color) atau opacity untuk memberikan visual feedback hover yang stabil.

## Contoh Implementasi

### PopupModal untuk Delete Confirmation
```tsx
<PopupModal
  isOpen={!!showDeleteModal}
  onClose={() => setShowDeleteModal(null)}
  maxWidth="sm"
>
  <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Delete Media</h3>
  <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
    Are you sure you want to delete this media?
  </p>

  <div className="flex gap-3 justify-end">
    <button
      onClick={() => setShowDeleteModal(null)}
      className="px-4 py-2 bg-[#27272a] text-[#e4e4e7] rounded-lg cursor-pointer"
    >
      Cancel
    </button>
    <button
      onClick={() => confirmDelete(showDeleteModal)}
      className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white rounded-lg cursor-pointer"
    >
      Delete
    </button>
  </div>
</PopupModal>
```

### PopupModal untuk Share Link
```tsx
<PopupModal
  isOpen={!!showShareModal}
  onClose={() => setShowShareModal(null)}
  maxWidth="md"
>
  <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Share Capture</h3>
  <p className="text-sm text-[#a1a1aa] mb-6">
    Anyone with this link can view this capture.
  </p>

  <div className="bg-[#0a0a0b] border border-[#3f3f46] rounded-lg p-4 flex items-center gap-3 mb-6">
    <input
      type="text"
      readOnly
      value={shareUrl}
      className="flex-1 bg-transparent text-sm text-white outline-none"
    />
    <button
      onClick={handleCopy}
      className="bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white py-1.5 px-4 rounded-lg cursor-pointer"
    >
      Copy
    </button>
  </div>

  <button
    onClick={handleRevoke}
    className="text-sm text-[#ef4444] hover:text-[#dc2626] cursor-pointer"
  >
    Revoke Link
  </button>
</PopupModal>
```

## Aturan Sinkronisasi Chrome Extension

### Sinkronisasi Folder ext-local dan ext-prod
Semua modifikasi kode pada folder `ext-local` (Chrome Extension lokal) **WAJIB** disinkronkan ke folder `ext-prod` (Chrome Extension produksi) untuk file yang bersesuaian (seperti `content.js`, `service_worker.js`, `popup.js`, dll.).
- Modifikasi tidak boleh hanya dilakukan di salah satu folder saja.
- Pastikan kedua folder memiliki logika fungsional yang identik (kecuali perbedaan konfigurasi environment atau URL API backend).

## Checklist untuk AI Agent

Saat membuat atau memodifikasi UI component, pastikan:
- [ ] Semua button memiliki `cursor-pointer`
- [ ] Semua clickable element memiliki `cursor-pointer`
- [ ] Icon close "X" di modal memiliki `cursor-pointer`
- [ ] Hover state ditambahkan untuk feedback visual
- [ ] Animasi smooth pada interaksi (transition, transform)
- [ ] PopupModal digunakan untuk semua dialog/modal (jangan buat custom modal baru)
- [ ] Modifikasi file Chrome Extension (`ext-local`) sudah disinkronkan sepenuhnya ke `ext-prod`
