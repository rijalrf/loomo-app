'use client';

import { toast } from 'sonner';

export default function LandingClient() {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #152238 0%, #0B0F19 80%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '25%',
        width: '300px',
        height: '300px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '400px',
        height: '400px',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <main style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            boxShadow: '0 0 15px var(--primary)'
          }}></div>
          <span style={{
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(to right, #ffffff, #94A3B8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Loomo</span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 4.5rem)',
          lineHeight: '1.1',
          marginBottom: '20px',
          fontWeight: '900',
          letterSpacing: '-0.04em'
        }}>
          Show, don't <br />
          <span style={{
            background: 'linear-gradient(to right, var(--primary), #34D399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(16,185,129,0.2)'
          }}>just tell.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}>
          Capture screenshots, annotate instantly, and record tab video. 
          Everything uploads automatically to your own Google Drive. Share clean, custom Loomo links.
        </p>

        {/* Login Button */}
        <button 
          onClick={handleLogin}
          className="btn-primary"
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            borderRadius: '12px',
            gap: '12px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)'
          }}
        >
          {/* Custom Google Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign In with Google</span>
        </button>

        <p style={{
          marginTop: '20px',
          fontSize: '13px',
          color: 'var(--text-dark)'
        }}>
          Secure login via Google OAuth. We only request permission to manage files created by Loomo.
        </p>

        {/* Features Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          width: '100%',
          marginTop: '80px',
          textAlign: 'left'
        }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ color: 'var(--primary)', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>1. AREA CAPTURE & ANNOTATE</div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Drag-to-capture screenshots and mark them up directly in your browser with rectangles, circle, text, and highlight overlays.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>2. TAB SCREEN RECORDER</div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Record your browser tab along with your microphone and tab audio. Perfect for bug reports, walkthroughs, and visual explanations.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ color: '#F59E0B', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>3. PER-USER GOOGLE DRIVE</div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Loomo doesn't permanently store your media. Files go straight to your own Google Drive account so you retain absolute ownership.
            </p>
          </div>
        </div>

        {/* Chrome Store Badge */}
        <div style={{
          marginTop: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Get the Loomo Chrome Extension</span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#1E293B',
            padding: '10px 18px',
            borderRadius: '30px',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }} onClick={() => toast.info('Loomo Chrome Extension is ready! Load the folder "extension" inside Chrome developer mode.')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-10-10z"/>
              <path d="M12 6v12M6 12h12"/>
            </svg>
            <span>Developer Mode: Load "extension" folder</span>
          </div>
        </div>
      </main>

      <footer style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '12px',
        color: 'var(--text-dark)'
      }}>
        © {new Date().getFullYear()} Loomo. Built for Advanced Agentic Coding.
      </footer>
    </div>
  );
}
