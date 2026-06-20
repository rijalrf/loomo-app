'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import { Folder, Image as ImageIcon, Video, Users, BookOpen, Search, LayoutGrid, List, Play, LogOut, Trash2, Link2, Download, Eye, Plus, Check, ChevronDown, Settings, Edit2, Calendar, HardDrive, Share2, AlertCircle, LayoutDashboard, History, TrendingUp, Sparkles, ArrowUpRight, Bell, Mail, Square, CheckSquare, MoreHorizontal, HelpCircle } from 'lucide-react';
import OnboardingJourney from './OnboardingJourney';
import { showConfirm } from '@/lib/customDialog';
import Sidebar from './Sidebar';

import CustomSelect from './CustomSelect';
import CreateWorkspaceModal from './CreateWorkspaceModal';

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
    PRIVATE: { label: 'Private', color: 'bg-[var(--text-muted)]' },
    UNLISTED: { label: 'Unlisted', color: 'bg-[var(--primary)]' },
    WORKSPACE_ONLY: { label: 'Workspace', color: 'bg-[var(--secondary)]' }
  };

  const current = options[value];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-transparent text-sm font-bold text-[var(--text-muted)] outline-none cursor-pointer uppercase tracking-tight hover:text-white transition-all"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.color}`}></span>
        <span>{current.label}</span>
        <ChevronDown size={14} className="text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 w-32 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-lg p-1.5 animate-in fade-in duration-150`}>
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
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm font-bold uppercase transition-colors cursor-pointer ${
                  optKey === value
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></span>
                <span className="flex-1 text-left">{opt.label}</span>
                {optKey === value && (
                  <Check size={14} className="text-[var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MiniSparkline = ({ data, color }: { data: number[], color: string }) => {
  return (
    <svg width="40" height="20" className="opacity-80">
      {data.map((val, idx) => {
        const height = (val / 10) * 16 + 4; // max height is 20
        const x = idx * 5;
        const y = 20 - height;
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width="3"
            height={height}
            fill={color}
            rx="0.5"
          />
        );
      })}
    </svg>
  );
};

const CaptureActivityChart = () => {
  const chartData = [
    { label: 'Jan', screenshot: 8, recording: 3 },
    { label: 'Feb', screenshot: 12, recording: 5 },
    { label: 'Mar', screenshot: 15, recording: 6 },
    { label: 'Apr', screenshot: 10, recording: 4 },
    { label: 'May', screenshot: 18, recording: 8 },
    { label: 'Jun', screenshot: 24, recording: 12 }, // Peak
    { label: 'Jul', screenshot: 14, recording: 7 },
    { label: 'Aug', screenshot: 13, recording: 6 },
    { label: 'Sep', screenshot: 17, recording: 9 },
    { label: 'Oct', screenshot: 19, recording: 11 },
    { label: 'Nov', screenshot: 11, recording: 4 },
    { label: 'Dec', screenshot: 15, recording: 5 },
  ];

  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col h-full select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">Sales Trend</span>
          <HelpCircle size={14} className="text-[var(--text-dark)]" />
        </div>
        <div className="flex bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-1 text-[10px] font-black text-[var(--text-muted)]">
          <button className="px-2.5 py-1 rounded-lg">Weekly</button>
          <button className="px-2.5 py-1 bg-[var(--bg-hover)] text-white rounded-lg">Monthly</button>
          <button className="px-2.5 py-1 rounded-lg">Yearly</button>
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-4">
        <span className="text-2xl font-black text-white">$20,320</span>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></span>
            <span>New User</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--primary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
            <span>Existing User</span>
          </div>
        </div>
      </div>

      {/* Grid Bar Chart */}
      <div className="flex-1 flex flex-col justify-end min-h-[180px]">
        {/* Equalizer track area */}
        <div className="relative h-40 flex items-end justify-between px-2 pb-1.5">
          {/* Background grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full border-b border-dashed border-[var(--border-color)] h-0"></div>
            <div className="w-full border-b border-dashed border-[var(--border-color)] h-0"></div>
            <div className="w-full border-b border-dashed border-[var(--border-color)] h-0"></div>
            <div className="w-full border-b border-dashed border-[var(--border-color)] h-0"></div>
          </div>

          {/* Render Columns */}
          {chartData.map((d, i) => {
            // Calculate segments (each segment represents 2 captures)
            const screenshotSegments = Math.min(10, Math.ceil(d.screenshot / 2));
            const recordingSegments = Math.min(6, Math.ceil(d.recording / 2));
            
            return (
              <div key={i} className="flex flex-col items-center flex-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 z-10 w-28 text-left">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{d.label} 2026</span>
                  <span className="text-xs font-black text-[var(--text-main)] mt-1">New User: {d.screenshot * 1.5}k</span>
                  <span className="text-xs font-black text-[var(--primary)] mt-0.5">Existing: {d.recording * 1.5}k</span>
                </div>

                {/* Stacks */}
                <div className="flex flex-col gap-[3px] w-2.5 sm:w-3 items-center justify-end h-32">
                  {/* Recording segments (Cyan/Primary) */}
                  {Array.from({ length: recordingSegments }).map((_, idx) => (
                    <div key={idx} className="w-full h-1 bg-[var(--primary)] rounded-sm"></div>
                  ))}
                  {/* Screenshot segments (Gray) */}
                  {Array.from({ length: screenshotSegments }).map((_, idx) => (
                    <div key={idx} className="w-full h-1 bg-[var(--border-color)] rounded-sm"></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels Row */}
        <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] px-2 mt-2 pt-2 border-t border-[var(--border-color)]">
          {chartData.map((d, i) => (
            <span key={i} className="flex-1 text-center">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TypeBreakdownChart = () => {
  const data = [
    { label: 'Screenshots', val: 74, color: 'bg-[var(--bg-hover)] border border-[var(--border-color)]', text: 'text-[var(--text-muted)]' },
    { label: 'Recordings', val: 26, color: 'bg-[var(--primary)]', text: 'text-[var(--primary)]' },
  ];

  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col h-full justify-between select-none">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">Revenue Breakdown</span>
            <HelpCircle size={14} className="text-[var(--text-dark)]" />
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 cursor-pointer">
            Jan 1 - Aug 30 <ChevronDown size={10} />
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-2xl font-black text-white">$20,320</span>
        </div>

        {/* AI Insight Card matching the Sparkles box in design-reference */}
        <div className="border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl p-3.5 flex items-center justify-between gap-3 mb-6 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles size={16} className="text-purple-400 group-hover:animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-purple-300 truncate">Get AI insight for better analysis</span>
          </div>
          <ArrowUpRight size={14} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
        </div>
      </div>

      {/* Simple vertical bar comparison */}
      <div className="flex items-end justify-around h-32 px-4 gap-4">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-2.5 rounded-full bg-[var(--bg-main)] h-28 relative overflow-hidden flex flex-col justify-end">
            <div className="w-full bg-[var(--bg-hover)]" style={{ height: '70%' }}></div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Screenshots</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-2.5 rounded-full bg-[var(--bg-main)] h-28 relative overflow-hidden flex flex-col justify-end">
            <div className="w-full bg-[var(--primary)]" style={{ height: '40%' }}></div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)]">Recordings</span>
        </div>
      </div>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState<'overview' | 'captures'>('overview');
  
  // Sync tab with URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const tab = queryParams.get('tab');
      if (tab === 'overview' || tab === 'captures') {
        setActiveTab(tab as any);
      }
    }
  }, []);
  
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
    const confirmed = await showConfirm('Are you sure you want to delete this media? This will permanently delete it from Loomo and your Google Drive.');
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
    const confirmed = await showConfirm('Revoking this link will deactivate the current share URL. Anyone visiting it will lose access. Proceed?');
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

  const totalStorageBytes = mediaList.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  const formattedStorage = totalStorageBytes > 0 ? (totalStorageBytes / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB';
  const activeSharesCount = mediaList.filter(m => m.shareToken !== null).length;

  return (
    <div className="min-h-screen flex bg-[var(--bg-card)] text-slate-200">
      {/* Sidebar */}
      <Sidebar
        initialUser={initialUser}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onCreateWorkspaceClick={() => setShowCreateModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-main)] backdrop-blur-md sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-[var(--text-muted)] font-medium">Workspace</span>
            <span className="text-[var(--border-color)] font-medium">&gt;</span>
            <span className="text-[var(--primary)] font-bold">All Captures</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* User Profile Avatar */}
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-xs font-bold">
                {initialUser.displayName[0]}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-5 w-full">
          {/* All Captures Tab (Original Media List / Gallery) */}
          <>
            {/* Title and stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                  {activeWorkspace?.name || 'Workspace Dashboard'}
                </h2>
                <p className="text-[var(--text-muted)] text-sm font-medium">
                  You have <span className="text-[var(--primary)]">{totalMedia}</span> captures in this workspace.
                </p>
              </div>
            </div>

            {/* Toolbar: Search, Filters, Sorting, Toggle View */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-5 w-full">
              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input
                    type="text"
                    placeholder="Search captures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-white pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <CustomSelect
                  value={filterType}
                  onChange={(val) => {
                    setFilterType(val as any);
                    setPage(1);
                  }}
                  options={[
                    { value: 'ALL', label: 'All Types', icon: <Folder size={16} className="text-[var(--text-muted)]" /> },
                    { value: 'SCREENSHOT', label: 'Screenshots', icon: <ImageIcon size={16} className="text-[var(--primary)]" /> },
                    { value: 'RECORDING', label: 'Recordings', icon: <Video size={16} className="text-[var(--secondary)]" /> }
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
                    { value: 'ALL', label: 'Any Status', icon: <Folder size={16} className="text-[var(--text-muted)]" /> },
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
                <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1 shrink-0">
                  <button
                    onClick={() => setIsGridView(true)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${isGridView ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setIsGridView(false)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isGridView ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Media List / Grid */}
            {sortedMedia.length === 0 ? (
              <div className="glass-panel py-16 px-6 rounded-lg text-center border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-main)] flex items-center justify-center mb-6 border border-[var(--border-color)]">
                  <ImageIcon className="text-[var(--text-muted)]" size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No captures yet</h3>
                <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
                  Use the Loomo Chrome Extension to take screenshots or record your screen. They will automatically appear here.
                </p>
                <button 
                  onClick={() => toast.info('Load the "extension" folder in Chrome Developer mode.')}
                  className="btn-primary cursor-pointer py-2 px-5 text-sm"
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
                      className={`media-card flex flex-col h-full bg-[var(--bg-main)] border-[var(--border-color)] group ${isDeleting ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                    >
                      {/* Card Thumbnail */}
                      <div 
                        className="relative pt-[56.25%] bg-slate-950 cursor-pointer overflow-hidden rounded-t-md"
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
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/90 flex items-center justify-center text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                                  <Play size={20} fill="currentColor" />
                                </div>
                              </div>
                            )}
                            {/* Duration badge */}
                            {media.type === 'RECORDING' && (
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-bold">
                                {Math.floor(media.durationSeconds / 60)}:{String(media.durationSeconds % 60).padStart(2, '0')}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            {isDeleting && (
                              <>
                                <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin"></div>
                                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Deleting...</span>
                              </>
                            )}
                            {isPending && (
                              <>
                                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin"></div>
                                <span className="text-xs font-bold text-[var(--primary)] tracking-wider uppercase">
                                  {media.uploadStatus === 'PROCESSING' ? 'Processing' : 'Uploading'}
                                </span>
                              </>
                            )}
                            {isFailed && (
                              <>
                                <AlertCircle className="text-red-500" size={32} />
                                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Failed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${media.type === 'SCREENSHOT' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-purple-500/10 text-purple-400'}`}>
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
                              className="bg-[var(--bg-main)] border border-[var(--primary)] text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
                            />
                          ) : (
                            <h4 
                              className="text-sm font-bold text-[var(--text-main)] truncate flex-1 hover:text-[var(--primary)] transition-colors cursor-pointer"
                              onClick={() => isReady && setActiveMediaViewer(media)}
                            >
                              {media.title}
                            </h4>
                          )}

                          {isReady && renamingId !== media.id && (
                            <button
                              onClick={() => { setRenamingId(media.id); setRenamingTitle(media.title); }}
                              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1 cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(media.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive size={14} />
                            {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '-'}
                          </span>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                          {isReady ? (
                            <MediaVisibilitySelect
                              value={media.visibility}
                              onChange={(val) => handleVisibilityChange(media.id, val)}
                              direction="up"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[var(--text-dark)] uppercase tracking-widest">Processing</span>
                          )}

                          <div className="flex gap-2">
                            {isReady && (
                              <button
                                onClick={() => handleShareLink(media)}
                                className="p-2 rounded-lg bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 border border-[var(--border-color)] transition-all cursor-pointer"
                                title="Share"
                              >
                                <Share2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(media.id)}
                              className="p-2 rounded-lg bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 border border-[var(--border-color)] transition-all cursor-pointer"
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
                <div className="glass-panel rounded-lg overflow-hidden border-[var(--border-color)] bg-[var(--bg-main)]/80">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase text-xs tracking-widest bg-[var(--bg-main)]/50">
                      <th className="px-6 py-4">Preview</th>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {sortedMedia.map((media) => {
                      const isReady = media.uploadStatus === 'READY';
                      const isDeleting = media.uploadStatus === 'DELETING';
                      return (
                        <tr 
                          key={media.id} 
                          className={`hover:bg-[var(--bg-hover)]/30 transition-colors ${isDeleting ? 'opacity-40 grayscale' : ''}`}
                        >
                          <td className="px-6 py-3">
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-[var(--bg-main)] border border-[var(--border-color)] group-hover:border-[var(--primary)]/50 transition-colors">
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
                            <span className={`px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${media.type === 'SCREENSHOT' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-purple-500/10 text-purple-400'}`}>
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
                              <span className="text-[var(--text-dark)]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-[var(--text-muted)] font-medium">
                            {new Date(media.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-[var(--text-muted)] font-medium">
                            {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '-'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="inline-flex gap-2">
                              {isReady && (
                                <button onClick={() => handleShareLink(media)} className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">
                                  <Share2 size={14} />
                                </button>
                              )}
                              <button onClick={() => handleDelete(media.id)} className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer">
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
              <div className="flex flex-col sm:flex-row items-center justify-between mt-10 border-t border-[var(--border-color)] pt-6 gap-4">
                <div className="text-sm text-[var(--text-muted)] font-semibold">
                  Showing page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span> ({totalMedia} captures)
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-2 px-4 text-xs rounded-lg"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pNum = idx + 1;
                      if (
                        totalPages > 5 &&
                        pNum !== 1 &&
                        pNum !== totalPages &&
                        Math.abs(pNum - page) > 1
                      ) {
                        if (pNum === 2 && page > 3) return <span key={pNum} className="text-[var(--text-dark)] px-1">...</span>;
                        if (pNum === totalPages - 1 && page < totalPages - 2) return <span key={pNum} className="text-[var(--text-dark)] px-1">...</span>;
                        return null;
                      }
                      
                      return (
                        <button
                          key={pNum}
                          onClick={() => setPage(pNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                            page === pNum
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--bg-card)]/50 hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white'
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
                    className="btn-secondary py-2 px-4 text-xs rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        </main>
      </div>

      {/* Media Viewer Modal */}
      {activeMediaViewer && (
        <div className="fixed inset-0 bg-[#0c0c0e]/95 z-[100] flex flex-col backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50">
            <div>
              <h3 className="text-lg font-black text-white leading-tight">{activeMediaViewer.title}</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Captured by {activeMediaViewer.uploader.displayName} • {new Date(activeMediaViewer.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setActiveMediaViewer(null)}
              className="btn-secondary py-2 px-6 rounded-full border-[var(--border-color)] hover:bg-white hover:text-black hover:border-white transition-all font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Media Body */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full h-full max-w-6xl flex items-center justify-center bg-black rounded-xl overflow-hidden border border-[var(--border-color)]">
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
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md bg-[var(--bg-card)]/95 rounded-xl overflow-hidden border-[var(--border-color)] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">Share Capture</h3>
              <button onClick={() => setShowShareModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">✕</button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
              Anyone with this link can view this capture. Loomo acts as a secure proxy to your Google Drive.
            </p>

            <div className="flex bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-2 mb-8 items-center gap-2 group focus-within:border-[var(--primary)] transition-colors">
              <span className="text-xs font-bold text-[var(--text-main)] flex-1 px-3 truncate">
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
                <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Link Active</span>
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
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newWs) => {
          setWorkspaces((prev) => [...prev, newWs]);
          setActiveWorkspaceId(newWs.id);
          setPage(1);
          setShowCreateModal(false);
        }}
      />

    </div>
  );
}
