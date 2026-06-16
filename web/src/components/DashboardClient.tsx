'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';

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
        alert('Failed to delete media');
        fetchMedia(); // restore
      }
    } catch (e) {
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
        setInviteSuccess(true);
        setInviteEmail('');
        fetchMembers();
      } else {
        setInviteError(data.error || 'Invitation failed');
      }
    } catch (err) {
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
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (e) {
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
        }
      } catch (e) {
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
        setMediaList(prev => prev.map(m => m.id === media.id ? { ...m, shareToken: null } : m));
        setShowShareModal(null);
      }
    } catch (e) {
      clientLogger.error('dashboard-client', 'Failed to revoke share link:', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(19, 27, 46, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Logo and Workspace Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              boxShadow: '0 0 10px var(--primary)'
            }}></div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Loomo</span>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>

          {/* Workspace Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={activeWorkspaceId}
              onChange={(e) => {
                setActiveWorkspaceId(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none'
              }}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isOwner ? '(Owner)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowMembersModal(true)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Members</span>
            </button>
          </div>
        </div>

        {/* Profile Info and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{initialUser.displayName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{initialUser.email}</div>
          </div>
          {initialUser.avatarUrl ? (
            <img 
              src={initialUser.avatarUrl} 
              alt={initialUser.displayName} 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
            />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {initialUser.displayName[0]}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--error)' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '30px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Title and stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0' }}>
              {activeWorkspace?.name || 'Workspace Dashboard'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              Showing {mediaList.length} of {totalMedia} captures in this workspace.
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorting, Toggle View */}
        <div className="glass-panel" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: '12px',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Search and Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ flex: 1, minWidth: '200px', padding: '8px 12px', fontSize: '14px' }}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Formats</option>
              <option value="SCREENSHOT">Screenshots</option>
              <option value="RECORDING">Recordings</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Sorting and Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="DATE_DESC">Newest Captures</option>
              <option value="DATE_ASC">Oldest Captures</option>
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="SIZE_DESC">Largest Files</option>
            </select>

            {/* View Toggle */}
            <div style={{
              display: 'flex',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setIsGridView(true)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: isGridView ? 'var(--primary)' : 'transparent',
                  color: isGridView ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setIsGridView(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: !isGridView ? 'var(--primary)' : 'transparent',
                  color: !isGridView ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Media List / Grid */}
        {sortedMedia.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '80px 20px',
            borderRadius: '16px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No captures found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 auto 20px auto', maxWidth: '360px' }}>
              Screenshots or screen recordings you capture using the Loomo Chrome Extension will appear here.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>
              Tip: Use the Loomo extension shortcut or popup to record/capture.
            </div>
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
                  className={`media-card ${isDeleting ? 'media-card-deleting' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  {/* Card Thumbnail / Top section */}
                  <div style={{ 
                    position: 'relative', 
                    paddingTop: '56.25%', 
                    backgroundColor: '#0F1626',
                    cursor: isReady ? 'pointer' : 'default',
                    overflow: 'hidden'
                  }}
                  onClick={() => isReady && setActiveMediaViewer(media)}
                  >
                    {isReady ? (
                      <>
                        <img 
                          src={`/api/media/${media.id}/thumbnail`}
                          alt={media.title}
                          style={{
                            position: 'absolute',
                            top: 0, right: 0, bottom: 0, left: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {/* Video type indicator overlay */}
                        {media.type === 'RECORDING' && (
                          <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(11, 15, 25, 0.8)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                          }}>
                            {/* Play icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                          </div>
                        )}
                        {/* Duration badge for recording */}
                        {media.type === 'RECORDING' && (
                          <span style={{
                            position: 'absolute',
                            bottom: '8px', right: '8px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {Math.floor(media.durationSeconds / 60)}:{String(media.durationSeconds % 60).padStart(2, '0')}
                          </span>
                        )}
                      </>
                    ) : (
                      <div style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, left: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '8px'
                      }}>
                        {isDeleting && (
                          <>
                            <div className="glow-animation" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--error)', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: '600' }}>Deleting from Drive...</span>
                          </>
                        )}
                        {isPending && (
                          <>
                            <div className="glow-animation" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                              {media.uploadStatus === 'PROCESSING' ? 'Processing...' : 'Uploading...'}
                            </span>
                          </>
                        )}
                        {isFailed && (
                          <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: '600' }}>Upload failed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      {renamingId === media.id ? (
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          onBlur={() => handleRename(media.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(media.id)}
                          autoFocus
                          style={{
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--primary)',
                            color: 'var(--text-main)',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            width: '100%',
                            outline: 'none'
                          }}
                        />
                      ) : (
                        <h4 
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            cursor: isReady ? 'pointer' : 'default'
                          }}
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </h4>
                      )}

                      {/* Rename Trigger */}
                      {isReady && renamingId !== media.id && (
                        <button
                          onClick={() => { setRenamingId(media.id); setRenamingTitle(media.title); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '2px' }}
                          title="Rename"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      {/* Format Icon */}
                      <span style={{
                        display: 'inline-flex',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: media.type === 'SCREENSHOT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: media.type === 'SCREENSHOT' ? 'var(--primary)' : 'var(--accent)'
                      }}>
                        {media.type}
                      </span>

                      {/* Date */}
                      <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>
                        {new Date(media.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      {/* Visibility dropdown */}
                      {isReady ? (
                        <select
                          value={media.visibility}
                          onChange={(e) => handleVisibilityChange(media.id, e.target.value as any)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="PRIVATE" style={{ backgroundColor: 'var(--bg-card)' }}>Private</option>
                          <option value="UNLISTED" style={{ backgroundColor: 'var(--bg-card)' }}>Unlisted</option>
                          <option value="WORKSPACE_ONLY" style={{ backgroundColor: 'var(--bg-card)' }}>Workspace</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>
                          Processing...
                        </span>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Copy Share Link */}
                        {isReady && (
                          <button
                            onClick={() => handleShareLink(media)}
                            className="btn-secondary"
                            style={{ padding: '6px', borderRadius: '6px' }}
                            title="Share"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                          </button>
                        )}

                        {/* Delete Button (Allowed in all states except deleting) */}
                        {!isDeleting && (
                          <button
                            onClick={() => handleDelete(media.id)}
                            className="btn-secondary"
                            style={{ padding: '6px', borderRadius: '6px', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Thumbnail</th>
                  <th style={{ padding: '12px 16px' }}>Title</th>
                  <th style={{ padding: '12px 16px' }}>Format</th>
                  <th style={{ padding: '12px 16px' }}>Visibility</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Size</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMedia.map((media) => {
                  const isReady = media.uploadStatus === 'READY';
                  const isDeleting = media.uploadStatus === 'DELETING';
                  return (
                    <tr 
                      key={media.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        opacity: isDeleting ? 0.4 : 1,
                        backgroundColor: isDeleting ? 'transparent' : 'rgba(19, 27, 46, 0.2)'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ width: '64px', height: '36px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#0F1626' }}>
                          {isReady ? (
                            <img src={`/api/media/${media.id}/thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                              {media.uploadStatus.toLowerCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        <span 
                          style={{ cursor: isReady ? 'pointer' : 'default' }}
                          onClick={() => isReady && setActiveMediaViewer(media)}
                        >
                          {media.title}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>{media.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isReady ? (
                          <select
                            value={media.visibility}
                            onChange={(e) => handleVisibilityChange(media.id, e.target.value as any)}
                            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', outline: 'none' }}
                          >
                            <option value="PRIVATE" style={{ backgroundColor: 'var(--bg-card)' }}>Private</option>
                            <option value="UNLISTED" style={{ backgroundColor: 'var(--bg-card)' }}>Unlisted</option>
                            <option value="WORKSPACE_ONLY" style={{ backgroundColor: 'var(--bg-card)' }}>Workspace</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-dark)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {new Date(media.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {media.fileSizeBytes ? `${(media.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB` : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {isReady && (
                            <button onClick={() => handleShareLink(media)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Share</button>
                          )}
                          {!isDeleting && (
                            <button onClick={() => handleDelete(media.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>Delete</button>
                          )}
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

      {/* Media Viewer Modal */}
      {activeMediaViewer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.95)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{activeMediaViewer.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                Uploaded by {activeMediaViewer.uploader.displayName} on {new Date(activeMediaViewer.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setActiveMediaViewer(null)}
              className="btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              Close Viewer
            </button>
          </div>

          {/* Media Body */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            overflow: 'hidden'
          }}>
            {activeMediaViewer.type === 'SCREENSHOT' ? (
              <img
                src={`/api/media/${activeMediaViewer.id}/file`}
                alt={activeMediaViewer.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                  borderRadius: '8px',
                  backgroundColor: 'black'
                }}
              />
            ) : (
              <video
                src={`/api/media/${activeMediaViewer.id}/file`}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                  borderRadius: '8px',
                  backgroundColor: 'black'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Workspace Members Modal */}
      {showMembersModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Workspace Members</h3>
              <button 
                onClick={() => { setShowMembersModal(false); setInviteError(null); setInviteSuccess(false); }}
                className="btn-secondary" 
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Invite New Member */}
            {activeWorkspace?.isOwner && (
              <form onSubmit={handleInvite} style={{
                backgroundColor: 'rgba(19, 27, 46, 0.4)',
                border: '1px solid var(--border-color)',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '13px', margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Invite member by email</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-text"
                    required
                    style={{ flex: 1, padding: '6px 12px', fontSize: '14px' }}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="OWNER">Owner</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Invite
                  </button>
                </div>

                {inviteError && (
                  <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>{inviteError}</div>
                )}
                {inviteSuccess && (
                  <div style={{ color: 'var(--primary)', fontSize: '12px', marginTop: '8px' }}>Invitation sent successfully!</div>
                )}
              </form>
            )}

            {/* Members List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {members.map((member) => (
                <div 
                  key={member.membershipId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: 'var(--border-color)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'
                      }}>
                        {member.displayName[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>
                        {member.displayName}
                        {!member.accepted && (
                          <span style={{
                            marginLeft: '8px', fontSize: '10px', color: 'var(--warning)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px'
                          }}>
                            Pending
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {member.role}
                    </span>

                    {/* Remove button: Only workspace owner can delete members, and members can delete themselves */}
                    {activeWorkspace?.isOwner && member.userId !== initialUser.id && (
                      <button
                        onClick={() => handleRemoveMember(member.membershipId)}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Share Captures</h3>
              <button onClick={() => setShowShareModal(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Anyone with this link can view this capture, regardless of their workspace membership. We proxy the file from your Google Drive so your account details remain private.
            </p>

            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '10px 14px',
              borderRadius: '8px',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <span style={{
                fontSize: '13px',
                color: 'var(--text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/s/${showShareModal.shareToken}` : ''}
              </span>

              <button
                onClick={() => copyToClipboard(
                  `${window.location.origin}/s/${showShareModal.shareToken}`,
                  showShareModal.id
                )}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {copiedId === showShareModal.id ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dark)' }}>
                Link is active
              </span>

              <button
                onClick={() => handleRevokeShare(showShareModal)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                Revoke Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
