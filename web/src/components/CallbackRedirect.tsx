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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0B0F19',
      color: '#94A3B8',
      fontFamily: 'sans-serif'
    }}>
      <div className="glow-animation" style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--primary)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        marginBottom: '20px'
      }}></div>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
        Connecting your Google Account...
      </p>
    </div>
  );
}
