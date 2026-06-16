'use client';

import { useEffect } from 'react';

interface SessionSyncProps {
  session: {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

export default function SessionSync({ session }: SessionSyncProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (session) {
      const gdriveSession = {
        token: 'active_session_token', // acts as a truthy placeholder token
        user: {
          id: session.userId,
          email: session.email,
          name: session.displayName,
          avatar: session.avatarUrl
        }
      };
      
      localStorage.setItem('gdrive_user_session', JSON.stringify(gdriveSession));
      window.dispatchEvent(new CustomEvent('loomo_session_changed', { detail: gdriveSession }));
    } else {
      localStorage.removeItem('gdrive_user_session');
      window.dispatchEvent(new CustomEvent('loomo_session_changed', { detail: null }));
    }
  }, [session]);

  return null;
}
