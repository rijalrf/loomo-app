'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { User, Folder, Lock } from 'lucide-react';

function LoginCard() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const email = searchParams.get('email') || '';

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google?flow=login';
  };

  const getErrorMessage = () => {
    if (error === 'not_registered') {
      return `Email ${email ? `(${email})` : ''} belum terdaftar di Loomo. Silakan registrasi terlebih dahulu untuk menggunakan Loomo.`;
    }
    if (error) {
      return 'Terjadi kesalahan sistem saat mencoba masuk. Silakan coba lagi.';
    }
    return null;
  };

  const errorMsg = getErrorMessage();

  return (
    <div className="glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 shadow-2xl relative">
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-bold flex flex-col gap-2 leading-normal">
          <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">⚠️ AKUN BELUM TERDAFTAR</span>
          <span>{errorMsg}</span>
          <Link href="/register" className="text-[var(--primary)] hover:underline mt-1 block font-black text-right uppercase tracking-wider text-[10px]">
            Daftar Akun Baru &rarr;
          </Link>
        </div>
      )}

      {/* Google Login Button */}
      <button 
        onClick={handleGoogleLogin}
        className="btn-secondary w-full py-3 px-6 text-base font-bold bg-[var(--bg-card)] hover:border-[var(--primary)]"
      >
        {/* Google G Logo SVG */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-color)]"></div>
        </div>
        <span className="relative px-3 bg-[var(--bg-card-alt)] text-xs text-[var(--text-muted)] font-medium">INFORMASI PERIZINAN AKSES</span>
      </div>

      {/* Permissions Scope Info */}
      <div className="space-y-4 text-xs text-[var(--text-muted)] leading-relaxed">
        <p className="text-[var(--text-muted)]">
          Loomo berkomitmen penuh pada privasi dan keamanan data Anda. Saat masuk, kami meminta otorisasi akun Google Anda dengan cakupan akses berikut:
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex gap-3 items-start">
            <User className="text-[var(--primary)] shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="text-[var(--text-main)] block">Profil & Alamat Email</strong>
              <span>Digunakan untuk membuat akun Loomo Anda dan menampilkan nama serta avatar Anda di dashboard.</span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Folder className="text-[var(--primary)] shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="text-[var(--text-main)] block">Google Drive (Akses Terbatas: drive.file)</strong>
              <span>Izin membuat, membaca, dan mengubah folder khusus bernama <code className="bg-[var(--bg-main)] px-1 py-0.5 rounded text-cyan-300 font-mono">Loomo</code> di root Drive Anda. Loomo hanya dapat mengakses file yang dibuat/diunggah melalui Loomo.</span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Lock className="text-[var(--primary)] shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="text-[var(--text-main)] block">Privasi Data Mutlak</strong>
              <span>Loomo <strong className="text-red-400">TIDAK BISA</strong> melihat, mengedit, atau mengakses berkas-berkas pribadi Anda yang lain di Google Drive. File Anda tetap aman 100%.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)] text-[10px] text-center text-[var(--text-muted)]">
          Belum memiliki akun?{' '}
          <Link href="/register" className="text-[var(--primary)] hover:underline font-semibold">
            Daftar sekarang
          </Link>.<br/>
          Kembali ke <Link href="/" className="text-[var(--primary)] hover:underline font-semibold">Halaman Utama</Link>.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-muted)] font-sans flex items-center justify-center p-6 relative selection:bg-cyan-500/30">
      {/* Background blur effects */}
      <div className="absolute top-[15%] left-[15%] w-[350px] h-[350px] bg-[var(--primary)]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[15%] w-[450px] h-[450px] bg-[var(--secondary)]/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
            <img src="/logo.png" alt="Loomo Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black tracking-tight text-white">Loomo</span>
          </Link>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Masuk ke Akun Anda</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Hubungkan dengan Google untuk mulai berbagi umpan balik visual</p>
        </div>

        <Suspense fallback={<div className="glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 shadow-2xl text-center text-sm text-[var(--text-muted)]">Memuat...</div>}>
          <LoginCard />
        </Suspense>
      </div>
    </div>
  );
}
