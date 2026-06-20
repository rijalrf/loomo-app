"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function LandingClient() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-muted)] font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="/logo.png"
              alt="Loomo Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-black tracking-tight text-white">
              Loomo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="text-sm font-bold text-[var(--text-muted)] hover:text-white px-4 py-2 transition-colors cursor-pointer"
            >
              Login
            </button>
            <Link 
              href="/register"
              className="btn-primary py-2 px-6 text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-36 pb-20 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] bg-[var(--secondary)]/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>

        {/* Left Column (Content & CTAs) */}
        <div className="w-full lg:w-1/2 text-left z-10 relative flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/50 text-xs text-[var(--text-muted)] mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
            <span>Privacy-First & Unlimited Storage</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight text-white">
            Show, don&apos;t <br />
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              just tell.
            </span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-xl mb-8 leading-relaxed">
            The fastest way to capture your screen, add visual annotations, and
            share feedback instantly. All files are saved directly in your{" "}
            <strong>personal Google Drive</strong>. Fast, 100% private, secure,
            and no extra subscription fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-start items-center w-full">
            <Link
              href="/register"
              className="btn-gradient py-4 px-10 text-lg w-full sm:w-auto"
            >
              Get Started for Free
            </Link>
            <a
              href="/loomo-extension.zip"
              download
              className="btn-secondary py-4 px-8 text-lg w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 text-[var(--primary)] animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Download Extension
            </a>
          </div>
        </div>

        {/* Right Column (Interactive CSS Mockup) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative mt-10 lg:mt-0 z-10">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-30 blur-lg group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative w-full max-w-lg glass-panel rounded-xl border border-[var(--border-color)]/60 shadow-2xl bg-[var(--bg-card)]/60 p-1 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-[var(--primary)]/40">
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-main)]/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                loomo-editor.html
              </span>
              <span className="w-4 h-4"></span>
            </div>

            {/* Mock Image & Annotations */}
            <div className="relative bg-[var(--bg-main)] aspect-[16/10] overflow-hidden flex items-center justify-center">
              {/* Fake web layout inside */}
              <div className="w-full h-full p-6 flex flex-col justify-between opacity-35">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="w-20 h-3 bg-[var(--bg-hover)] rounded"></div>
                  <div className="flex gap-2">
                    <div className="w-8 h-3 bg-[var(--bg-hover)] rounded"></div>
                    <div className="w-8 h-3 bg-[var(--bg-hover)] rounded"></div>
                  </div>
                </div>
                <div className="space-y-3 flex-1 pt-4">
                  <div className="w-full h-16 bg-[var(--bg-hover)]/50 rounded-lg border border-[var(--border-color)]"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 bg-[var(--bg-hover)]/50 rounded"></div>
                    <div className="h-10 bg-[var(--bg-hover)]/50 rounded"></div>
                    <div className="h-10 bg-[var(--bg-hover)]/50 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Glowing annotations */}
              <div className="absolute top-1/4 left-1/4 border border-red-500 bg-red-500/10 px-2 py-1 rounded shadow-[0_0_10px_rgba(239,68,68,0.2)] text-[9px] text-red-500 font-bold flex items-center gap-1">
                <span>⚠️ Fix Layout Bug</span>
              </div>

              <svg
                className="absolute top-1/4 left-1/3 translate-x-12 translate-y-3 w-16 h-8 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 100 50"
              >
                <path d="M10,10 L70,30" />
                <path d="M60,32 L70,30 L65,22" />
              </svg>

              <div className="absolute bottom-6 right-6 border border-[var(--primary)] bg-[var(--primary)]/20 px-3 py-1.5 rounded-lg text-[10px] text-white shadow-[0_0_15px_rgba(12,178,235,0.4)] flex items-center gap-2 animate-pulse">
                <Zap
                  size={14}
                  className="w-3.5 h-3.5 text-[var(--primary)]"
                />
                <svg
                  className="w-3.5 h-3.5 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span>Saved to Loomo Folder inside Google Drive</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Sections */}
      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-24 z-10 relative text-[var(--text-muted)]">
        {/* Bento Grid Features */}
        <section id="features" className="scroll-mt-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-xs text-[var(--secondary)] mb-3 font-semibold">
              <Zap size={14} className="text-[var(--secondary)] fill-[var(--secondary)]" />
              <span>Loomo Power</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              One Extension, Multiple Solutions
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm leading-relaxed">
              Specially designed to speed up team coordination with a modern
              modular bento grid interface.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 (Wide: 2 Cols) - Capture & Anotasi */}
            <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 relative overflow-hidden flex flex-col justify-between group hover:border-[var(--primary)]/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Precision Area Capture & Annotations
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-md">
                  Capture any area of the screen with a pixel-perfect crosshair,
                  then add visual annotations like arrows, boxes, highlight
                  markers, and text explanations instantly using our built-in
                  image editor.
                </p>
              </div>
              <div className="mt-8 flex gap-2 overflow-hidden items-center border border-[var(--border-color)] p-2.5 bg-[var(--bg-main)]/40 rounded-lg max-w-sm">
                <span className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                  Editor
                </span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)]"></span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  Press &apos;Save&apos; to sync instantly
                </span>
              </div>
            </div>

            {/* Box 2 (Standard) - Drive Sync */}
            <div className="md:col-span-1 glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 relative overflow-hidden flex flex-col justify-between group hover:border-[var(--secondary)]/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/5 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)] mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Google Drive Sync
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  100% stored in your personal Google Drive with secure,
                  encrypted authorization. Absolute privacy under your full
                  control.
                </p>
              </div>
              <div className="mt-8 border border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl flex items-center gap-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  100% Privacy Connected
                </span>
              </div>
            </div>

            {/* Box 3 (Standard) - Perekam Tab */}
            <div className="md:col-span-1 glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 relative overflow-hidden flex flex-col justify-between group hover:border-cyan-400/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Tab Video Recording
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  Record screen activity directly from your browser tab in
                  real-time, complete with microphone audio input without
                  needing any desktop applications.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-1.5 text-[10px] font-mono text-red-500 bg-red-500/10 px-2.5 py-1 rounded w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>REC TAB AUDIO ON</span>
              </div>
            </div>

            {/* Box 4 (Wide: 2 Cols) - Loomo Link Sharing */}
            <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 relative overflow-hidden flex flex-col justify-between group hover:border-[var(--primary)]/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Shareable Links & Workspace Collaboration
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-md">
                  Generate short Loomo links (`loomo.app/s/token`) to share
                  instantly without exposing your raw Google Drive links. Create
                  shared workspaces for your team and manage file visibility
                  centrally.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 items-center">
                <div className="border border-[var(--border-color)] bg-[var(--bg-main)]/50 px-3 py-1.5 rounded-lg text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                  <span>loomo.app/s/design-feedback-xyz</span>
                  <button className="text-[var(--primary)] hover:text-white font-bold">
                    Copy
                  </button>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[8px] font-bold text-white">
                    R
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[var(--border-color)] border border-[var(--border-color)] flex items-center justify-center text-[8px] font-bold text-white">
                    L
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[8px] font-bold text-[var(--text-muted)]">
                    +3
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-8 text-center text-sm text-[var(--text-muted)] relative z-10">
        <p>© {new Date().getFullYear()} Loomo. All rights reserved.</p>
        <p className="mt-2">Privacy-first Visual Feedback</p>
      </footer>
    </div>
  );
}
