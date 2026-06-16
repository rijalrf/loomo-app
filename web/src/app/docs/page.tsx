'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const handleLogin = () => {
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'features', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
      const scrollPosition = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img src="/logo.png" alt="Loomo Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black tracking-tight text-white">Loomo <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-[#0CB2EB] ml-1">Docs</span></span>
          </Link>
          
          <div className="flex items-center gap-6">
            <a 
              href="/loomo-extension.zip" 
              download 
              className="text-[#0CB2EB] hover:text-white transition-colors flex items-center gap-1.5 font-semibold text-sm"
            >
              <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Extension
            </a>
            <button 
              onClick={handleLogin}
              className="btn-primary py-1.5 px-4 text-xs rounded-lg font-semibold"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 flex gap-10">
        
        {/* Left Sidebar (Desktop Navigation) */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto pr-4 border-r border-slate-800/50">
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Introduction</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection('overview')}
                    className={`text-left w-full transition-colors ${activeSection === 'overview' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Platform Overview
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className={`text-left w-full transition-colors ${activeSection === 'features' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Features & Capabilities
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">How to Use</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection('step-1')}
                    className={`text-left w-full transition-colors ${activeSection === 'step-1' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    1. Login & Authorization
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('step-2')}
                    className={`text-left w-full transition-colors ${activeSection === 'step-2' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    2. Browser Extension Installation
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('step-3')}
                    className={`text-left w-full transition-colors ${activeSection === 'step-3' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    3. Capture Screen & Video
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('step-4')}
                    className={`text-left w-full transition-colors ${activeSection === 'step-4' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    4. Annotate & Upload
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('step-5')}
                    className={`text-left w-full transition-colors ${activeSection === 'step-5' ? 'text-[#0CB2EB] font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    5. File Management & Share Links
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="flex-1 max-w-3xl space-y-16">
          
          {/* Overview */}
          <section id="overview" className="scroll-mt-28">
            <h1 className="text-4xl font-extrabold text-white mb-6 tracking-tight">
              Platform Overview
            </h1>
            <div className="prose prose-invert max-w-none text-slate-300 space-y-4">
              <p className="leading-relaxed text-base">
                <strong className="text-white">Loomo</strong> is a modern visual collaboration solution designed to speed up feedback delivery without sacrificing your data privacy. The platform combines a lightweight <strong>Browser Extension</strong> with an interactive and responsive <strong>Web Application</strong>.
              </p>
              <p className="leading-relaxed">
                With Loomo, you can easily capture specific parts of your browser screen (area capture) with pixel-perfect precision, add instant annotations (like text, arrows, highlight boxes), or record browser tab activity in real-time complete with microphone audio input.
              </p>
              
              <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/30 my-6">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0CB2EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Why Store in Your Personal Google Drive?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Most visual sharing platforms store your files on third-party servers with hidden monthly costs or free tier limitations. Loomo cuts this chain by syncing your files directly and securely to your personal Google Drive. You maintain 100% ownership of your files, absolute data privacy, and storage capacity matching your own Google account limits.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-850" />

          {/* Features */}
          <section id="features" className="scroll-mt-28">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">
              Features & Capabilities
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300 space-y-6">
              <p className="leading-relaxed">
                Loomo is equipped with a suite of powerful tools optimized for high performance directly within your web browser and centralized web integration. Below are the functional details of Loomo's core features:
              </p>

              {/* Feature 1 */}
              <div className="border-l-2 border-[#0CB2EB] pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">1. Precision Area Capture</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Use the screenshot selector to choose specific elements of a web page (such as UI components, images, or text areas) precisely, avoiding the need to capture the entire screen.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="border-l-2 border-[#8A5CF6] pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">2. Interactive Annotation Editor</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Once a screenshot is captured, the built-in image editor opens automatically. You can dynamically add visual guides:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 ml-2">
                  <li>Draw arrows to guide user flow or navigation.</li>
                  <li>Draw geometric shapes (Boxes, Circles) to focus on key areas.</li>
                  <li>Insert customizable text notes.</li>
                  <li>Highlight important text with a semi-transparent highlighter brush.</li>
                  <li>Support undo and redo actions to easily correct your annotations.</li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="border-l-2 border-cyan-400 pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">3. Tab Video Recording</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Record video activity of your browser tab instantly. The recording system processes video and audio in high quality with optimal data compression to keep files lightweight for sharing.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="border-l-2 border-[#0CB2EB] pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">4. Automatic Google Drive Sync</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  All saved media files are automatically uploaded to your Google Drive in the background. This process runs seamlessly so you can continue working without waiting.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="border-l-2 border-[#8A5CF6] pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">5. Secure Shareable Links</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Loomo acts as a secure media viewer. When someone accesses a shared short link, the system verifies their access permission first, then displays the media in a clean web interface without ever exposing the raw link to your private Google Drive storage.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="border-l-2 border-cyan-400 pl-4 space-y-2">
                <h4 className="text-lg font-bold text-white">6. Workspace Collaboration</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Team workspaces allow shared media ownership in work groups. Users can create separate workspaces for different projects, invite teammates to join, and categorize file privacy (Private, Restricted, or Public).
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-850" />

          {/* How to Use Section Title */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">How to Use</h2>
            <p className="text-slate-400 text-sm">Follow the steps below to start using the Loomo platform.</p>
          </div>

          {/* Step 1 */}
          <section id="step-1" className="scroll-mt-28 space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-xs bg-[#0CB2EB]/20 text-[#0CB2EB] px-2.5 py-1 rounded font-bold uppercase tracking-wider">Step 1</span>
              <h3 className="text-xl font-bold text-white">Login & Account Sync</h3>
            </div>
            <div className="pl-0 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                First, connect your Google account with the Loomo platform. Loomo uses Google's official secure authorization system to sync data with your personal Google Drive.
              </p>
              <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 space-y-2">
                <span className="text-xs font-bold text-[#8A5CF6] uppercase tracking-widest block">ℹ️ Access Permission Info</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Loomo is designed with the principle of least privilege. This permission only allows the Loomo application to create, read, and update files created by the application itself. Our platform has no ability or permission to view, open, or delete other personal files stored in your Google Drive.
                </p>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section id="step-2" className="scroll-mt-28 space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-xs bg-[#8A5CF6]/20 text-[#8A5CF6] px-2.5 py-1 rounded font-bold uppercase tracking-wider">Step 2</span>
              <h3 className="text-xl font-bold text-white">Browser Extension Installation</h3>
            </div>
            <div className="pl-0 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                Download and install the Loomo browser extension to capture your screen activity. This extension is designed to be lightweight and secure to install on your preferred web browser.
              </p>
              <div className="glass-panel p-6 rounded-xl border border-slate-850 space-y-3 bg-slate-900/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Extension Installation Guide:</h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                  <li>Download the compressed extension file by clicking the <a href="/loomo-extension.zip" download className="text-[#0CB2EB] hover:underline font-bold">Download Extension</a> button at the top right of this page.</li>
                  <li>Extract the downloaded zip archive into a folder on your computer.</li>
                  <li>Open your web browser and go to the browser extensions management page.</li>
                  <li>Enable the developer mode switch on the extensions management page.</li>
                  <li>Click the button to load an unpacked extension, then select the extracted folder.</li>
                  <li>The Loomo extension is now active and its icon can be pinned to your browser's toolbar.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section id="step-3" className="scroll-mt-28 space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2.5 py-1 rounded font-bold uppercase tracking-wider">Step 3</span>
              <h3 className="text-xl font-bold text-white">Media Capture & Recording</h3>
            </div>
            <div className="pl-0 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                Once the extension is installed, you can click the Loomo icon on your browser toolbar at any time to open the visual capture panel:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-850">
                  <h4 className="text-sm font-bold text-[#0CB2EB] mb-2 flex items-center gap-1.5">
                    <span>📸</span> Area Capture
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Capture a specific part of your web page flexibly.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When activated, click and drag your mouse to select the area you want to capture, then release to finish.
                  </p>
                </div>
                <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-850">
                  <h4 className="text-sm font-bold text-[#8A5CF6] mb-2 flex items-center gap-1.5">
                    <span>🎥</span> Tab Recording
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Record a video of your browser tab activity along with audio.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enable microphone recording if needed, then click start. Use the floating control panel to pause or stop recording.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section id="step-4" className="scroll-mt-28 space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-xs bg-[#0CB2EB]/20 text-[#0CB2EB] px-2.5 py-1 rounded font-bold uppercase tracking-wider">Step 4</span>
              <h3 className="text-xl font-bold text-white">Image Annotation & Auto Upload</h3>
            </div>
            <div className="pl-0 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                If you capture an image using the Area Capture method, your browser will automatically open a new tab containing the built-in Loomo image editor.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                In this editor panel, you can add visual guides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 ml-2">
                <li>Use geometric shapes (Boxes/Circles) to point out interface bugs or areas.</li>
                <li>Add arrows to point out user flow or key steps.</li>
                <li>Use the highlighter brush to draw attention to important text.</li>
                <li>Write explanatory text notes directly on top of the image.</li>
              </ul>
              <p className="text-slate-300 text-sm leading-relaxed">
                Once finished, click the <strong className="text-white font-semibold">Save & Share</strong> button. The image will be safely and automatically uploaded to your personal Google Drive in the background.
              </p>
            </div>
          </section>

          {/* Step 5 */}
          <section id="step-5" className="scroll-mt-28 space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-xs bg-[#8A5CF6]/20 text-[#8A5CF6] px-2.5 py-1 rounded font-bold uppercase tracking-wider">Step 5</span>
              <h3 className="text-xl font-bold text-white">File Management & Share Links</h3>
            </div>
            <div className="pl-0 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                The catalog of your captured screenshots and video recordings saved in Google Drive can be easily managed from the Loomo web dashboard:
              </p>
              <ul className="list-disc list-inside space-y-2.5 text-xs text-slate-400 ml-2">
                <li><strong className="text-slate-200">Rename Titles:</strong> Customize file names to find them easily later.</li>
                <li><strong className="text-slate-200">File Visibility:</strong> Control who can access your files (Private, Team Only, or Anyone with the link).</li>
                <li><strong className="text-slate-200">Shareable Links:</strong> Click the Share button to get a unique Loomo link. Recipients can view screenshots or play recordings directly in their browser without needing access to your Google Drive.</li>
              </ul>
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-[#0F172A] py-8 text-center text-sm text-slate-500 relative z-10">
        <p>© {new Date().getFullYear()} Loomo. All rights reserved.</p>
        <p className="mt-2">Privacy-first Visual Feedback</p>
      </footer>
    </div>
  );
}
