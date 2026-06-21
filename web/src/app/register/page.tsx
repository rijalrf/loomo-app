'use client';

import Link from 'next/link';

export default function RegisterPage() {
  const handleGoogleRegister = () => {
    window.location.href = '/api/auth/google?flow=register';
  };

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
          <h1 className="text-xl font-extrabold text-white tracking-tight">Daftar Akun Baru</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Daftar menggunakan akun Google Anda untuk mulai menggunakan Loomo</p>
        </div>

        {/* Register Card */}
        <div className="glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 shadow-2xl relative">
          {/* Google Register Button */}
          <button 
            onClick={handleGoogleRegister}
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
            Sign up with Google
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]"></div>
            </div>
            <span className="relative px-3 bg-[var(--bg-card-alt)] text-xs text-[var(--text-muted)] font-medium">INFORMASI PENDAFTARAN</span>
          </div>

          <div className="space-y-4 text-xs text-[var(--text-muted)] leading-relaxed">
            <p className="text-[var(--text-muted)]">
              Registrasi ini akan membuat akun baru dan membuka form onboarding untuk mengonfigurasi workspace pertama Anda di Loomo.
            </p>

            <p>
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">
                Masuk di sini
              </Link>.
            </p>

            <div className="pt-4 border-t border-[var(--border-color)] text-[10px] text-center text-[var(--text-muted)]">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan Loomo.<br/>
              Kembali ke <Link href="/" className="text-[var(--primary)] hover:underline font-semibold">Halaman Utama</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
