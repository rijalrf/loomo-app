'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import { Folder, Image as ImageIcon, Video, Users, BookOpen, Search, LayoutGrid, List, Play, LogOut, Trash2, Link2, Download, Eye, Plus, Check, ChevronDown, Settings, Edit2, Calendar, HardDrive, Share2, AlertCircle } from 'lucide-react';
import OnboardingJourney from './OnboardingJourney';
import { showConfirm } from '@/lib/customDialog';

interface SelectOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  placeholder = 'Select option',
  size = 'md',
  align = 'left'
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  const py = size === 'sm' ? 'py-1.5' : 'py-2.5';
  const px = size === 'sm' ? 'px-2.5' : 'px-4';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const rounded = size === 'sm' ? 'rounded-lg' : 'rounded-xl';

  const defaultBtnClass = `w-full flex items-center justify-between gap-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white ${px} ${py} ${rounded} ${text} font-semibold outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer`;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultBtnClass}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 min-w-full w-max max-w-[280px] bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1 animate-in fade-in slide-in-from-top-1 duration-150 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
                  option.value === value
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                {option.icon}
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check size={14} className="text-[var(--primary)] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaVisibilitySelect({
  value,
  onChange,
  direction = 'down'
}: {
  value: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  onChange: (value: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => void;
  direction?: 'up' | 'down';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = {
    PRIVATE: { label: 'Private', color: 'bg-slate-500' },
    UNLISTED: { label: 'Unlisted', color: 'bg-[var(--primary)]' },
    WORKSPACE_ONLY: { label: 'Workspace', color: 'bg-[var(--secondary)]' }
  };

  const current = options[value];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-transparent text-[11px] font-bold text-slate-400 outline-none cursor-pointer uppercase tracking-tight hover:text-white transition-all"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.color}`}></span>
        <span>{current.label}</span>
        <ChevronDown size={10} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 w-32 bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl p-1 animate-in fade-in duration-150`}>
          {(Object.keys(options) as Array<keyof typeof options>).map((optKey) => {
            const opt = options[optKey];
            return (
              <button
                key={optKey}
                type="button"
                onClick={() => {
                  onChange(optKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  optKey === value
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></span>
                <span className="flex-1 text-left">{opt.label}</span>
                {optKey === value && (
                  <Check size={10} className="text-[var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface Media {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  title: string;
  type: 'SCREENSHOT' | 'RECORDING';
  driveThumbnailUrl: string | null;
  shareToken: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  uploadStatus: 'PROCESSING' | 'UPLOADING' | 'READY' | 'FAILED' | 'DELETING';
  durationSeconds: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploader: {
    displayName: string;
    avatarUrl: string;
  };
}

interface Member {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  role: string;
  invitedAt: string;
  accepted: boolean;
}

interface DashboardClientProps {
  initialUser: User;
  initialWorkspaces: Workspace[];
  initialMedia: Media[];
}

export default function DashboardClient({
  initialUser,
  initialWorkspaces,
  initialMedia
}: DashboardClientProps) {
  const router = useRouter();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    initialWorkspaces[0]?.id || ''
  );
  
  // Sync workspace with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loomo_active_workspace_id');
    if (saved && workspaces.some(w => w.id === saved)) {
      setActiveWorkspaceId(saved);
    }
  }, [workspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('loomo_active_workspace_id', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);
  
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [totalMedia, setTotalMedia] = useState(0);
  
  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SCREENSHOT' | 'RECORDING'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'READY' | 'PROCESSING' | 'FAILED'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'SIZE_DESC'>('DATE_DESC');
  const [isGridView, setIsGridView] = useState(true);
  const [page, setPage] = useState(1);

  // Modals & Popups
  const [activeMediaViewer, setActiveMediaViewer] = useState<Media | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceDept, setNewWorkspaceDept] = useState('Engineering & Product');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  
  // Sharing Dialog
  const [showShareModal, setShowShareModal] = useState<Media | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline renaming
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Polling ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active Workspace
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const totalPages = Math.ceil(totalMedia / 10);

  // Load Media List on workspace/filter change
  const fetchMedia = async () => {
    try {
      const queryParams = new URLSearchParams({
        workspaceId: activeWorkspaceId,
        page: String(page),
        limit: '10'
      });
      if (filterType !== 'ALL') queryParams.append('type', filterType.toLowerCase());
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus.toLowerCase());
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await fetch(`/api/media?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media);
        setTotalMedia(data.total);
      }
    } catch (e) {
      clientLogger.error('dashboard-client', 'Failed to fetch media:', e);
    }
  };

  useEffect(() => {
    // Skip fetching media if we are about to redirect for importing data from extension
    const isImportPending = new URLSearchParams(window.location.search).get('importPending') === 'true';
    if (isImportPending) return;

    if (activeWorkspaceId) {
      fetchMedia();
    }
  }, [activeWorkspaceId, filterType, filterStatus, searchQuery, page]);

  // Sorting logic (done client-side for immediate response)
  const sortedMedia = [...mediaList].sort((a, b) => {
    if (sortBy === 'DATE_DESC') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'DATE_ASC') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'NAME_ASC') return a.title.localeCompare(b.title);
    if (sortBy === 'SIZE_DESC') return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
    return 0;
  });

  // Polling: If any media is PROCESSING or UPLOADING, poll every 5 seconds
  useEffect(() => {
    const hasPendingMedia = mediaList.some(
      m => m.uploadStatus === 'PROCESSING' || m.uploadStatus === 'UPLOADING' || m.uploadStatus === 'DELETING'
    );

    if (hasPendingMedia) {
      if (!pollingIntervalRef.current) {
        console.log('[Dashboard] Starting polling for pending media...');
        pollingIntervalRef.current = setInterval(() => {
          fetchMedia();
        }, 5000);
      }
    } else {
      if (pollingIntervalRef.current) {
        console.log('[Dashboard] Clearing polling (no pending media)...');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [mediaList]);



  // Actions
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreatingWorkspace(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDesc,
          department: newWorkspaceDept
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Workspace "${newWorkspaceName}" created successfully!`);
        setWorkspaces(prev => [...prev, data.workspace]);
        setActiveWorkspaceId(data.workspace.id);
        setPage(1);
        setShowCreateModal(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
        setNewWorkspaceDept('Engineering & Product');
      } else {
        toast.error(data.error || 'Failed to create workspace');
      }
    } catch (err) {
      toast.error('Network error. Failed to create workspace.');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renamingTitle.trim()) return;
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renamingTitle })
      });
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === id ? { ...m, title: renamingTitle } : m));
        setRenamingId(null);
      }
    } catch (e) {
      clientLogger.error('dashboard-client', 'Failed to rename media:', e);
    }
  };

  const handleVisibilityChange = async (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility })
      });
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === id ? { ...m, visibility } : m));
      }
    } catch (e) {
      clientLogger.error('dashboard-client', 'Failed to change media visibility:', e);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus media ini? Media akan dihapus permanen dari Loomo dan Google Drive Anda.');
    if (!confirmed) return;
    
    // Optimistic UI update: set to DELETING
    setMediaList(prev => prev.map(m => m.id === id ? { ...m, uploadStatus: 'DELETING' } : m));

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        toast.error('Failed to delete media');
        fetchMedia(); // restore
      } else {
        toast.success('Media queued for deletion successfully');
      }
    } catch (e) {
      toast.error('Failed to delete media');
      clientLogger.error('dashboard-client', 'Failed to delete media:', e);
      fetchMedia();
    }
  };



  const handleShareLink = async (media: Media) => {
    if (media.shareToken) {
      setShowShareModal(media);
    } else {
      // Create share token
      try {
        const res = await fetch(`/api/media/${media.id}/share`, {
          method: 'POST'
        });
        if (res.ok) {
          const data = await res.json();
          const updatedMedia = { ...media, shareToken: data.shareToken, visibility: data.visibility };
          setMediaList(prev => prev.map(m => m.id === media.id ? updatedMedia : m));
          setShowShareModal(updatedMedia);
          toast.success('Share link generated successfully');
        } else {
          toast.error('Failed to generate share link');
        }
      } catch (e) {
        toast.error('Failed to generate share link');
        clientLogger.error('dashboard-client', 'Failed to create share link:', e);
      }
    }
  };

  const handleRevokeShare = async (media: Media) => {
    const confirmed = await showConfirm('Mencabut link ini akan menonaktifkan URL share saat ini. Siapa pun yang mengaksesnya akan kehilangan akses. Lanjutkan?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/media/${media.id}/share`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Share link revoked successfully');
        setMediaList(prev => prev.map(m => m.id === media.id ? { ...m, shareToken: null } : m));
        setShowShareModal(null);
      } else {
        toast.error('Failed to revoke share link');
      }
    } catch (e) {
      toast.error('Failed to revoke share link');
      clientLogger.error('dashboard-client', 'Failed to revoke share link:', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/');
      window.location.reload();
    }
  };

  if (workspaces.length === 0) {
    return (
      <OnboardingJourney
        user={initialUser}
        onComplete={(newWorkspace) => {
          setWorkspaces([newWorkspace]);
          setActiveWorkspaceId(newWorkspace.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0F172A] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0B0F19] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div className="flex flex-col gap-6 p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Loomo Logo" className="w-7 h-7 object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl font-black tracking-tighter text-white">Loomo</span>
          </div>

          <div className="h-px bg-slate-800"></div>

          {/* Workspace Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</label>
            <CustomSelect
              value={activeWorkspaceId}
              onChange={(val) => {
                if (val === 'CREATE_NEW') {
                  setShowCreateModal(true);
                } else {
                  setActiveWorkspaceId(val);
                  setPage(1);
                }
              }}
              options={[
                ...workspaces.map(w => ({
                  value: w.id,
                  label: `${w.name} ${w.isOwner ? '(Owner)' : ''}`,
                  icon: <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                })),
                {
                  value: 'CREATE_NEW',
                  label: 'Create Workspace',
                  icon: <Plus size={14} className="text-[var(--primary)]" />
                }
              ]}
              className="w-full"
              buttonClassName="w-full flex items-center justify-between gap-2 bg-[#1E293B]/40 hover:bg-[#1E293B]/80 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            />
          </div>

          {/* Sidebar Menu */}
          <nav className="flex flex-col gap-1.5 mt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation</label>
            
            <button
              onClick={() => {
                setFilterType('ALL');
                setPage(1);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)] border-l-2 border-[var(--primary)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Folder size={18} />
              <span>All Media</span>
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <BookOpen size={18} />
              <span>Documentation</span>
            </a>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080D16]/50">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-bold text-slate-400 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-slate-800/80 rounded-md text-[10px] font-black uppercase text-[var(--primary)] tracking-wider border border-slate-700/60">
              Dashboard
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300 font-bold">{activeWorkspace?.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-sm font-bold text-white leading-none">{initialUser.displayName}</div>
              <div className="text-[10px] text-slate-500 font-medium">{initialUser.email}</div>
            </div>
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-9 h-9 rounded-full border border-slate-700 p-0.5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">
                {initialUser.displayName[0]}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-10 w-full">
        
        {/* Title and stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              {activeWorkspace?.name || 'Workspace Dashboard'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              You have <span className="text-[var(--primary)]">{totalMedia}</span> captures in this workspace.
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorting, Toggle View */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8 w-full">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search captures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:bg-slate-900/80 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            <CustomSelect
              value={filterType}
              onChange={(val) => {
                setFilterType(val as any);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Types', icon: <Folder size={14} className="text-slate-400" /> },
                { value: 'SCREENSHOT', label: 'Screenshots', icon: <ImageIcon size={14} className="text-[var(--primary)]" /> },
                { value: 'RECORDING', label: 'Recordings', icon: <Video size={14} className="text-[var(--secondary)]" /> }
              ]}
              className="w-full sm:w-auto"
            />

            <CustomSelect
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val as any);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'Any Status', icon: <Folder size={14} className="text-slate-400" /> },
                { value: 'READY', label: 'Ready', icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> },
                { value: 'PROCESSING', label: 'Processing', icon: <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" /> },
                { value: 'FAILED', label: 'Failed', icon: <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> }
              ]}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Sorting and Toggle */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'DATE_DESC', label: 'Recently Captured' },
                { value: 'DATE_ASC', label: 'Oldest First' },
                { value: 'NAME_ASC', label: 'Name (A-Z)' },
                { value: 'SIZE_DESC', label: 'File Size' }
              ]}
              className="w-full lg:w-auto flex-1 lg:flex-none"
            />

            {/* View Toggle */}
            <div className="flex bg-slate-900/40 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${isGridView ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isGridView ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Media List / Grid */}
        {sortedMedia.length === 0 ? (
          <div className="glass-panel py-20 px-6 rounded-2xl text-center border-slate-800/50 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-slate-800">
              <ImageIcon className="text-slate-500" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No captures yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
              Use the Loomo Chrome Extension to take screenshots or record your screen. They will automatically appear here.
            </p>
            <button 
              onClick={() => toast.info('Load the "extension" folder in Chrome Developer mode.')}
              className="btn-primary cursor-pointer"
            >
              Get Extension
            </button>
          </div>
        ) : isGridView ? (
          /* Grid View */
          <div className="media-grid">
            {sortedMedia.map((media) => {
              const isDeleting = media.uploadStatus === 'DELETING';
              const isReady = media.uploadStatus === 'READY';
              const isFailed = media.uploadStatus === 'FAILED';
              const isPending = media.uploadStatus === 'PROCESSING' || media.uploadStatus === 'UPLOADING';
              
              return (
                <div 
                  key={media.id} 
                  className={`media-card flex flex-col h-full bg-[#1E293B] border-slate-800 group ${isDeleting ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                  {/* Card Thumbnail */}
                  <div 
                    className="relative pt-[56.25%] bg-slate-950 cursor-pointer overflow-hidden rounded-t-xl"
                    onClick={() => isReady && setActiveMediaViewer(media)}
                  >
                    {isReady ? (
                      <>
                        <img 
                          src={`/api/media/${media.id}/thumbnail`}
                          alt={media.title}
                          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Play icon for recordings */}
                        {media.type === 'RECORDING' && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/90 flex items-center justify-center text-white shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                              <Play size={20} fill="currentColor" />
                            </div>
                          </div>
                        )}
                        {/* Duration badge */}
                        {media.type === 'RECORDING' && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {Math.floor(media.durationSeconds / 60)}:{String(media.durationSeconds % 60).padStart(2, '0')}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        {isDeleting && (
                          <>
                            <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin"></div>
                            <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Deleting...</span>
                          </>
                        )}
                        {isPending && (
                          <>
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin"></div>
                            <span className="text-[10px] font-bold text-[var(--primary)] tracking-wider uppercase">
                              {media.uploadStatus === 'PROCESSING' ? 'Processing' : 'Uploading'}
                            </span>
                          </>
                        )}
                        {isFailed && (
                          <>
                            <AlertCircle className="text-red-500" size={32} />
                            <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Failed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${media.type === 'SCREENSHOT' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--secondary)]/10 text-[var(--secondary)]'}`}>
                        {media.type}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {renamingId === media.id ? (
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          onBlur={() => handleRename(media.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(media.id)}
                          autoFocus
                          className="bg-slate-950 border border-[var(--primary)] text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
                        />
                      ) : (
                        <h4 
                          className="text-sm font-bold text-slate-100 truncate flex-1 hover:text-[var(--primary)] transition-colors cursor-pointer"
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </h4>
                      )}

                      {isReady && renamingId !== media.id && (
                        <button
                          onClick={() => { setRenamingId(media.id); setRenamingTitle(media.title); }}
                          className="text-slate-500 hover:text-[var(--primary)] transition-colors p-1 cursor-pointer"
                          title="Rename"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(media.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive size={12} />
                        {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '-'}
                      </span>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      {isReady ? (
                        <MediaVisibilitySelect
                          value={media.visibility}
                          onChange={(val) => handleVisibilityChange(media.id, val)}
                          direction="up"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Processing</span>
                      )}

                      <div className="flex gap-2">
                        {isReady && (
                          <button
                            onClick={() => handleShareLink(media)}
                            className="p-2 rounded-lg bg-slate-900/50 text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 border border-slate-800 transition-all cursor-pointer"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(media.id)}
                          className="p-2 rounded-lg bg-slate-900/50 text-slate-500 hover:text-red-400 hover:bg-red-400/10 border border-slate-800 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="glass-panel rounded-2xl overflow-hidden border-slate-800 bg-[#1E293B]/40">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[11px] tracking-widest bg-slate-900/50">
                  <th className="px-6 py-4">Preview</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedMedia.map((media) => {
                  const isReady = media.uploadStatus === 'READY';
                  const isDeleting = media.uploadStatus === 'DELETING';
                  return (
                    <tr 
                      key={media.id} 
                      className={`hover:bg-slate-800/30 transition-colors ${isDeleting ? 'opacity-40 grayscale' : ''}`}
                    >
                      <td className="px-6 py-3">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group-hover:border-[var(--primary)]/50 transition-colors">
                          {isReady ? (
                            <img src={`/api/media/${media.id}/thumbnail`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-4 h-4 border border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span 
                          className="font-bold text-white hover:text-[var(--primary)] cursor-pointer transition-colors"
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${media.type === 'SCREENSHOT' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--secondary)]/10 text-[var(--secondary)]'}`}>
                          {media.type}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {isReady ? (
                          <MediaVisibilitySelect
                            value={media.visibility}
                            onChange={(val) => handleVisibilityChange(media.id, val)}
                            direction="down"
                          />
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-medium">
                        {new Date(media.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-medium">
                        {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex gap-2">
                          {isReady && (
                            <button onClick={() => handleShareLink(media)} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-[var(--primary)] transition-colors cursor-pointer">
                              <Share2 size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(media.id)} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-10 border-t border-slate-800 pt-6 gap-4">
            <div className="text-xs text-slate-500 font-semibold">
              Showing page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span> ({totalMedia} captures)
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Only show current page, 1 page before/after, first page, and last page for spacing if pages is large
                  if (
                    totalPages > 5 &&
                    pNum !== 1 &&
                    pNum !== totalPages &&
                    Math.abs(pNum - page) > 1
                  ) {
                    if (pNum === 2 && page > 3) return <span key={pNum} className="text-slate-600 px-1">...</span>;
                    if (pNum === totalPages - 1 && page < totalPages - 2) return <span key={pNum} className="text-slate-600 px-1">...</span>;
                    return null;
                  }
                  
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                        page === pNum
                          ? 'bg-[var(--primary)] text-white shadow-lg'
                          : 'bg-slate-900/20 hover:bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>
    </div>

      {/* Media Viewer Modal */}
      {activeMediaViewer && (
        <div className="fixed inset-0 bg-slate-950/95 z-[100] flex flex-col backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <div>
              <h3 className="text-lg font-black text-white leading-tight">{activeMediaViewer.title}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Captured by {activeMediaViewer.uploader.displayName} • {new Date(activeMediaViewer.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setActiveMediaViewer(null)}
              className="btn-secondary py-2 px-6 rounded-full border-slate-700 hover:bg-white hover:text-black hover:border-white transition-all font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Media Body */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full h-full max-w-6xl flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800">
              {activeMediaViewer.type === 'SCREENSHOT' ? (
                <img
                  src={`/api/media/${activeMediaViewer.id}/file`}
                  alt={activeMediaViewer.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={`/api/media/${activeMediaViewer.id}/file`}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}



      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl border-slate-700/50 p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">Share Capture</h3>
              <button onClick={() => setShowShareModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Anyone with this link can view this capture. Loomo acts as a secure proxy to your Google Drive.
            </p>

            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-2 mb-8 items-center gap-2 group focus-within:border-[var(--primary)] transition-colors">
              <span className="text-xs font-bold text-slate-300 flex-1 px-3 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/s/${showShareModal.shareToken}` : ''}
              </span>

              <button
                onClick={() => copyToClipboard(
                  `${window.location.origin}/s/${showShareModal.shareToken}`,
                  showShareModal.id
                )}
                className="btn-primary py-2 px-4 text-xs rounded-lg cursor-pointer"
              >
                {copiedId === showShareModal.id ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Link Active</span>
              </div>

              <button
                onClick={() => handleRevokeShare(showShareModal)}
                className="text-xs font-black text-red-400/70 hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl border-slate-700/50 p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">Create Workspace</h3>
              <button 
                onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); setNewWorkspaceDesc(''); setNewWorkspaceDept('Engineering & Product'); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marketing Team, Personal Projects..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-[var(--primary)] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Collaborative space for marketing team (optional)..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-[var(--primary)] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department / Team</label>
                <select
                  value={newWorkspaceDept}
                  onChange={(e) => setNewWorkspaceDept(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-[var(--primary)] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all cursor-pointer font-medium"
                >
                  <option value="Engineering & Product" className="bg-[#0B0F19] text-white">Engineering & Product</option>
                  <option value="Design & Creative" className="bg-[#0B0F19] text-white">Design & Creative</option>
                  <option value="Marketing & Sales" className="bg-[#0B0F19] text-white">Marketing & Sales</option>
                  <option value="Operations & HR" className="bg-[#0B0F19] text-white">Operations & HR</option>
                  <option value="Personal & Individual" className="bg-[#0B0F19] text-white">Personal & Individual</option>
                  <option value="Other / Custom" className="bg-[#0B0F19] text-white">Other / Custom</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); setNewWorkspaceDesc(''); setNewWorkspaceDept('Engineering & Product'); }}
                  className="btn-secondary py-2.5 px-6 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWorkspace || !newWorkspaceName.trim()}
                  className="btn-primary py-2.5 px-6 rounded-xl text-xs justify-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
