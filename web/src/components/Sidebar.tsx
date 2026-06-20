'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Folder, Settings, BookOpen, ChevronDown, Check, Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  initialUser: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
    isOwner: boolean;
  }>;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  onCreateWorkspaceClick: () => void;
}

export default function Sidebar({
  initialUser,
  workspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  onCreateWorkspaceClick
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      } else {
        toast.error('Gagal keluar dari sesi');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi');
    }
  };

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 font-sans">
      <div className="flex flex-col gap-3.5 p-3.5">
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-white py-2.5 px-3 rounded-lg outline-none transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-black text-base shrink-0">
                {activeWorkspace?.name?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Workspace</span>
                <span className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors truncate">
                  {activeWorkspace?.name}
                </span>
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${workspaceDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.7)] p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider px-2.5 py-1.5">Select Workspace</label>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorkspaceId(w.id);
                      setWorkspaceDropdownOpen(false);
                      if (pathname !== '/') {
                        router.push('/');
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
                      w.id === activeWorkspaceId
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${w.id === activeWorkspaceId ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`} />
                    <span className="truncate flex-1">{w.name} {w.isOwner ? '(Owner)' : ''}</span>
                    {w.id === activeWorkspaceId && <Check size={14} className="text-[var(--primary)] shrink-0" />}
                  </button>
                ))}
                <div className="h-px bg-[var(--border-color)] my-1"></div>
                <button
                  onClick={() => {
                    onCreateWorkspaceClick();
                    setWorkspaceDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors cursor-pointer font-bold"
                >
                  <Plus size={16} />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-2.5">Main Menu</label>
            
            <button
              onClick={() => {
                if (pathname !== '/') {
                  router.push('/');
                }
              }}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                pathname === '/'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Folder size={16} />
              <span>All Captures</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-2.5">System</label>
            
            <button
              onClick={() => {
                if (pathname !== '/settings') {
                  router.push('/settings');
                }
              }}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                pathname === '/settings'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Documentation</span>
            </a>
          </div>
        </nav>
      </div>

      <div className="border-t border-[var(--border-color)] relative" ref={userDropdownRef}>
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="w-full flex items-center justify-between gap-3 p-3 hover:bg-[var(--bg-hover)] transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                {initialUser.displayName[0]}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{initialUser.displayName}</span>
              <span className="text-xs font-bold text-[var(--text-muted)] truncate leading-none mt-1">Pro Plan</span>
            </div>
          </div>
          <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
        </button>

        {userDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-[0_-10px_30px_rgba(0,0,0,0.7)] p-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
            <div className="px-2.5 py-1.5 border-b border-[var(--border-color)] mb-1">
              <div className="text-xs font-bold text-[var(--text-muted)] truncate">{initialUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-2.5 text-left hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-bold text-[var(--text-muted)] rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
