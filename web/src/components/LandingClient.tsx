'use client';

import { toast } from 'sonner';

export default function LandingClient() {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] p-5 relative overflow-hidden selection:bg-cyan-500/30">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[10%] left-[20%] w-[400px] height-[400px] bg-[#0CB2EB]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[15%] w-[500px] height-[500px] bg-[#8A5CF6]/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>

      <main className="max-w-4xl w-full text-center z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 group">
          <img 
            src="/logo.png" 
            alt="Loomo Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(12,178,235,0.4)] transition-transform group-hover:scale-110 duration-300" 
          />
          <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Loomo</span>
        </div>

        {/* Heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
          Show, don't <br />
          <span className="bg-gradient-to-r from-[#0CB2EB] to-[#8A5CF6] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(12,178,235,0.3)]">
            just tell.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          The fastest way to capture, annotate, and share visual feedback. 
          Everything stays in your Google Drive. Simple, private, and powerful.
        </p>

        {/* Login Button */}
        <button 
          onClick={handleLogin}
          className="btn-primary py-4 px-10 text-lg rounded-xl gap-3 shadow-[0_10px_30px_rgba(12,178,235,0.3)] hover:shadow-[0_15px_40px_rgba(12,178,235,0.5)]"
        >
          {/* Custom Google Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span className="font-bold">Sign In with Google</span>
        </button>

        <p className="mt-6 text-sm text-slate-500 max-w-sm">
          No extra account needed. Loomo creates its own folder in your Google Drive and only accesses its own files.
        </p>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 text-left">
          <div className="glass-panel p-8 rounded-2xl border-slate-800 hover:border-[#0CB2EB]/50 transition-colors group">
            <div className="text-[#0CB2EB] font-bold mb-3 text-sm tracking-widest uppercase">Capture & Annotate</div>
            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
              Pixel-perfect area capture. Add arrows, rectangles, and text annotations instantly to highlight what matters.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl border-slate-800 hover:border-[#8A5CF6]/50 transition-colors group">
            <div className="text-[#8A5CF6] font-bold mb-3 text-sm tracking-widest uppercase">Tab Recording</div>
            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
              Record high-quality video of your browser tabs with microphone support. Zero latency, local processing.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl border-slate-800 hover:border-cyan-400/50 transition-colors group">
            <div className="text-cyan-400 font-bold mb-3 text-sm tracking-widest uppercase">Drive-First Storage</div>
            <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
              We never see your files. They go straight from your browser to your Google Drive. You own your data.
            </p>
          </div>
        </div>

        {/* Chrome Store Badge Placeholder */}
        <div className="mt-20 flex flex-col items-center gap-4">
          <span className="text-sm text-slate-400">Available as a Chrome Extension</span>
          <button 
            onClick={() => toast.info('Loomo Chrome Extension is ready! Load the folder "extension" inside Chrome developer mode.')}
            className="flex items-center gap-3 bg-[#1E293B] hover:bg-[#334155] px-6 py-3 rounded-full border border-slate-700 transition-all text-sm font-semibold"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-10-10z"/>
              <path d="M12 6v12M6 12h12"/>
            </svg>
            <span>Developer Mode: Load "extension" folder</span>
          </button>
        </div>
      </main>

      <footer className="mt-20 pb-10 text-xs text-slate-600 font-medium">
        © {new Date().getFullYear()} Loomo • Built for Modern Teams
      </footer>
    </div>
  );
}
