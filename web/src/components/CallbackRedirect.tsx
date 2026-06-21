'use client';

import { useEffect } from 'react';

interface CallbackRedirectProps {
  code: string;
  state?: string;
}

export default function CallbackRedirect({ code, state }: CallbackRedirectProps) {
  useEffect(() => {
    // Redirect browser to the API Route Handler which can safely set cookies
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    window.location.href = `/api/auth/google/callback?code=${encodeURIComponent(code)}${stateParam}`;
  }, [code, state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-overlay)] text-slate-200 font-sans">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-[var(--primary)] rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-black uppercase tracking-widest text-[var(--primary)]">Connecting Account</p>
          <p className="text-xs text-slate-500 font-medium">Please wait while we sync with Google...</p>
        </div>
      </div>
    </div>
  );
}
