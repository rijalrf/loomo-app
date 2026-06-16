'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';

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
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'OWNER'>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
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

  // Load Media List on workspace/filter change
  const fetchMedia = async () => {
    try {
      const queryParams = new URLSearchParams({
        workspaceId: activeWorkspaceId,
        page: String(page),
        limit: '20'
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

  // Load Workspace Members
  const fetchMembers = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspace/members?workspaceId=${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (e) {
      clientLogger.error('dashboard-client', 'Failed to fetch workspace members:', e);
    }
  };

  useEffect(() => {
    if (showMembersModal) {
      fetchMembers();
    }
  }, [showMembersModal, activeWorkspaceId]);

  // Actions
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
    if (!confirm('Are you sure you want to delete this media? This will permanently delete it from Loomo and your Google Drive.')) return;
    
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId: activeWorkspaceId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent successfully to ${inviteEmail}`);
        setInviteSuccess(true);
        setInviteEmail('');
        fetchMembers();
      } else {
        toast.error(data.error || 'Invitation failed');
        setInviteError(data.error || 'Invitation failed');
      }
    } catch (err) {
      toast.error('Network error. Failed to send invitation.');
      setInviteError('Network error');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Remove this member from the workspace?')) return;
    try {
      const res = await fetch(`/api/workspace/members/${membershipId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Member removed successfully');
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (e) {
      toast.error('Failed to remove member');
      clientLogger.error('dashboard-client', 'Failed to remove member:', e);
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
    if (!confirm('Revoking this link will deactivate the current share URL. Anyone visiting it will lose access. Proceed?')) return;
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
            <select
              value={activeWorkspaceId}
              onChange={(e) => {
                setActiveWorkspaceId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1E293B] border border-slate-700 text-white px-3 py-2 rounded-lg text-sm font-semibold outline-none focus:border-[#0CB2EB] transition-colors cursor-pointer"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isOwner ? '(Owner)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sidebar Menu */}
          <nav className="flex flex-col gap-1.5 mt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation</label>
            
            <button
              onClick={() => {
                setFilterType('ALL');
                setPage(1);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'ALL'
                  ? 'bg-[#0CB2EB]/15 text-[#0CB2EB] border-l-2 border-[#0CB2EB]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>📁</span>
              <span>All Captures</span>
            </button>

            <button
              onClick={() => {
                setFilterType('SCREENSHOT');
                setPage(1);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'SCREENSHOT'
                  ? 'bg-[#0CB2EB]/15 text-[#0CB2EB] border-l-2 border-[#0CB2EB]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>📸</span>
              <span>Screenshots</span>
            </button>

            <button
              onClick={() => {
                setFilterType('RECORDING');
                setPage(1);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'RECORDING'
                  ? 'bg-[#0CB2EB]/15 text-[#0CB2EB] border-l-2 border-[#0CB2EB]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>🎥</span>
              <span>Recordings</span>
            </button>

            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
            >
              <span>👥</span>
              <span>Workspace Members</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
            >
              <span>📖</span>
              <span>Documentation</span>
            </a>
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-slate-800 bg-[#080D16]/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-10 h-10 rounded-full border border-slate-700 p-0.5 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-sm font-bold text-white border border-slate-700 shrink-0">
                {initialUser.displayName[0]}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight">{initialUser.displayName}</span>
              <span className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{initialUser.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-bold text-slate-400 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-slate-800/80 rounded-md text-[10px] font-black uppercase text-[#0CB2EB] tracking-wider border border-slate-700/60">
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
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        
        {/* Title and stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              {activeWorkspace?.name || 'Workspace Dashboard'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              You have <span className="text-[#0CB2EB]">{totalMedia}</span> captures in this workspace.
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorting, Toggle View */}
        <div className="glass-panel p-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4 mb-8 border-slate-800">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder="Search captures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-text w-full pl-10 text-sm bg-slate-900/50"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-[#0CB2EB]"
            >
              <option value="ALL">All Types</option>
              <option value="SCREENSHOT">Screenshots</option>
              <option value="RECORDING">Recordings</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-[#0CB2EB]"
            >
              <option value="ALL">Any Status</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Sorting and Toggle */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-[#0CB2EB] flex-1 lg:flex-none"
            >
              <option value="DATE_DESC">Recently Captured</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="SIZE_DESC">File Size</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-1.5 rounded-md transition-all ${isGridView ? 'bg-[#0CB2EB] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-1.5 rounded-md transition-all ${!isGridView ? 'bg-[#0CB2EB] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Media List / Grid */}
        {sortedMedia.length === 0 ? (
          <div className="glass-panel py-20 px-6 rounded-2xl text-center border-slate-800/50 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-slate-800">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No captures yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
              Use the Loomo Chrome Extension to take screenshots or record your screen. They will automatically appear here.
            </p>
            <button 
              onClick={() => toast.info('Load the "extension" folder in Chrome Developer mode.')}
              className="btn-primary"
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
                        {/* Type Indicator Overlay */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase shadow-lg ${media.type === 'SCREENSHOT' ? 'bg-[#0CB2EB] text-white' : 'bg-[#8A5CF6] text-white'}`}>
                            {media.type}
                          </span>
                        </div>
                        {/* Play icon for recordings */}
                        {media.type === 'RECORDING' && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-[#0CB2EB]/90 flex items-center justify-center text-white shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
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
                            <div className="w-8 h-8 rounded-full border-2 border-[#0CB2EB]/30 border-t-[#0CB2EB] animate-spin"></div>
                            <span className="text-[10px] font-bold text-[#0CB2EB] tracking-wider uppercase">
                              {media.uploadStatus === 'PROCESSING' ? 'Processing' : 'Uploading'}
                            </span>
                          </>
                        )}
                        {isFailed && (
                          <>
                            <svg className="text-red-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Failed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {renamingId === media.id ? (
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          onBlur={() => handleRename(media.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(media.id)}
                          autoFocus
                          className="bg-slate-950 border border-[#0CB2EB] text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
                        />
                      ) : (
                        <h4 
                          className="text-sm font-bold text-slate-100 truncate flex-1 hover:text-[#0CB2EB] transition-colors cursor-pointer"
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </h4>
                      )}

                      {isReady && renamingId !== media.id && (
                        <button
                          onClick={() => { setRenamingId(media.id); setRenamingTitle(media.title); }}
                          className="text-slate-500 hover:text-[#0CB2EB] transition-colors p-1"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {new Date(media.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '-'}
                      </span>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      {isReady ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${media.visibility === 'PRIVATE' ? 'bg-slate-600' : media.visibility === 'UNLISTED' ? 'bg-[#0CB2EB]' : 'bg-[#8A5CF6]'}`}></div>
                          <select
                            value={media.visibility}
                            onChange={(e) => handleVisibilityChange(media.id, e.target.value as any)}
                            className="bg-transparent text-[11px] font-bold text-slate-400 outline-none cursor-pointer uppercase tracking-tight hover:text-white transition-colors"
                          >
                            <option value="PRIVATE" className="bg-[#1E293B]">Private</option>
                            <option value="UNLISTED" className="bg-[#1E293B]">Unlisted</option>
                            <option value="WORKSPACE_ONLY" className="bg-[#1E293B]">Workspace</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Processing</span>
                      )}

                      <div className="flex gap-2">
                        {isReady && (
                          <button
                            onClick={() => handleShareLink(media)}
                            className="p-2 rounded-lg bg-slate-900/50 text-slate-400 hover:text-[#0CB2EB] hover:bg-[#0CB2EB]/10 border border-slate-800 transition-all"
                            title="Share"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(media.id)}
                          className="p-2 rounded-lg bg-slate-900/50 text-slate-500 hover:text-red-400 hover:bg-red-400/10 border border-slate-800 transition-all"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
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
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group-hover:border-[#0CB2EB]/50 transition-colors">
                          {isReady ? (
                            <img src={`/api/media/${media.id}/thumbnail`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-4 h-4 border border-[#0CB2EB]/30 border-t-[#0CB2EB] rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span 
                          className="font-bold text-white hover:text-[#0CB2EB] cursor-pointer transition-colors"
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${media.type === 'SCREENSHOT' ? 'bg-[#0CB2EB]/10 text-[#0CB2EB]' : 'bg-[#8A5CF6]/10 text-[#8A5CF6]'}`}>
                          {media.type}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {isReady ? (
                          <select
                            value={media.visibility}
                            onChange={(e) => handleVisibilityChange(media.id, e.target.value as any)}
                            className="bg-transparent border-none text-slate-400 text-xs font-bold focus:ring-0 outline-none uppercase tracking-tighter"
                          >
                            <option value="PRIVATE" className="bg-[#0F172A]">Private</option>
                            <option value="UNLISTED" className="bg-[#0F172A]">Unlisted</option>
                            <option value="WORKSPACE_ONLY" className="bg-[#0F172A]">Workspace</option>
                          </select>
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
                            <button onClick={() => handleShareLink(media)} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-[#0CB2EB] transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            </button>
                          )}
                          <button onClick={() => handleDelete(media.id)} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
              className="btn-secondary py-2 px-6 rounded-full border-slate-700 hover:bg-white hover:text-black hover:border-white transition-all font-bold"
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

      {/* Workspace Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl border-slate-700/50 animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-white tracking-tight">Workspace Members</h3>
              <button 
                onClick={() => { setShowMembersModal(false); setInviteError(null); setInviteSuccess(false); }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-8">
              {/* Invite New Member */}
              {activeWorkspace?.isOwner && (
                <form onSubmit={handleInvite} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl mb-8">
                  <h4 className="text-xs font-black text-[#0CB2EB] uppercase tracking-widest mb-4">Invite New Member</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Email address..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-text flex-1 bg-slate-900 border-slate-800 focus:border-[#0CB2EB]"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold outline-none"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <button type="submit" className="btn-primary py-2 px-6 rounded-lg text-sm shadow-[#0CB2EB]/20">
                      Invite
                    </button>
                  </div>

                  {inviteError && (
                    <div className="text-red-400 text-xs mt-3 font-bold flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="text-[#0CB2EB] text-xs mt-3 font-bold flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Invitation sent successfully!
                    </div>
                  )}
                </form>
              )}

              {/* Members List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div 
                    key={member.membershipId}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.displayName}
                          className="w-10 h-10 rounded-full border border-slate-700" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-black text-white">
                          {member.displayName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {member.displayName}
                          {!member.accepted && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black tracking-tighter">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-[#8A5CF6] uppercase tracking-widest bg-[#8A5CF6]/5 px-2 py-0.5 rounded-full border border-[#8A5CF6]/10">
                        {member.role}
                      </span>

                      {activeWorkspace?.isOwner && member.userId !== initialUser.id && (
                        <button
                          onClick={() => handleRemoveMember(member.membershipId)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Remove from workspace"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
              <button onClick={() => setShowShareModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Anyone with this link can view this capture. Loomo acts as a secure proxy to your Google Drive.
            </p>

            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-2 mb-8 items-center gap-2 group focus-within:border-[#0CB2EB] transition-colors">
              <span className="text-xs font-bold text-slate-300 flex-1 px-3 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/s/${showShareModal.shareToken}` : ''}
              </span>

              <button
                onClick={() => copyToClipboard(
                  `${window.location.origin}/s/${showShareModal.shareToken}`,
                  showShareModal.id
                )}
                className="btn-primary py-2 px-4 text-xs rounded-lg shadow-[#0CB2EB]/20"
              >
                {copiedId === showShareModal.id ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0CB2EB] animate-pulse"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Link Active</span>
              </div>

              <button
                onClick={() => handleRevokeShare(showShareModal)}
                className="text-xs font-black text-red-400/70 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
