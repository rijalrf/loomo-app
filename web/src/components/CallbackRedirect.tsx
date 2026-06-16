'use client';

import { useEffect } from 'react';

interface CallbackRedirectProps {
  code: string;
}

export default function CallbackRedirect({ code }: CallbackRedirectProps) {
  useEffect(() => {
    // Redirect browser to the API Route Handler which can safely set cookies
    window.location.href = `/api/auth/google/callback?code=${encodeURIComponent(code)}`;
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 font-sans">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-[#0CB2EB] rounded-full animate-spin shadow-[0_0_20px_rgba(12,178,235,0.2)]"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-black uppercase tracking-widest text-[#0CB2EB]">Connecting Account</p>
          <p className="text-xs text-slate-500 font-medium">Please wait while we sync with Google...</p>
        </div>
      </div>
    </div>
  );
}
