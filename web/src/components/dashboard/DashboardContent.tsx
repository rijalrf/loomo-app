'use client';

import { useState, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/clientLogger';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import MediaToolbar from '../media/MediaToolbar';
import MediaGrid from '../media/MediaGrid';
import MediaEmptyState from '../media/MediaEmptyState';
import MediaViewer from '../media/MediaViewer';
import PopupModal from '../PopupModal';
import { Link2, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import MediaVisibilitySelect from '../ui/MediaVisibilitySelect';

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
    avatarUrl: string | null;
  };
}

interface DashboardContentProps {
  activeWorkspaceId: string;
  activeWorkspaceName: string;
  initialMedia: Media[];
}

export default function DashboardContent({
  activeWorkspaceId,
  activeWorkspaceName,
  initialMedia
}: DashboardContentProps) {
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [totalMedia, setTotalMedia] = useState(0);
  const [isGridView, setIsGridView] = useState(true);
  const [activeMediaViewer, setActiveMediaViewer] = useState<Media | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    page,
    setPage,
    sortedMedia
  } = useMediaFilters(mediaList);

  const {
    handleRename,
    handleDelete,
    handleVisibilityChange,
    handleShareLink,
    handleRevokeShare,
    renamingId,
    setRenamingId,
    showShareModal,
    setShowShareModal
  } = useMediaActions(mediaList, setMediaList, fetchMedia);

  const [renamingTitle, setRenamingTitle] = useState('');

  async function fetchMedia() {
    if (!activeWorkspaceId) return;

    try {
      const params = new URLSearchParams();
      params.append('workspaceId', activeWorkspaceId);
      if (filterType !== 'ALL') params.append('type', filterType);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
        setTotalMedia(data.total || 0);
      }
    } catch (e) {
      clientLogger.error('dashboard-content', 'Failed to fetch media:', e);
    }
  }

  useEffect(() => {
    const isImportPending = new URLSearchParams(window.location.search).get('importPending') === 'true';
    if (isImportPending) return;

    if (activeWorkspaceId) {
      fetchMedia();
    }
  }, [activeWorkspaceId, filterType, filterStatus, searchQuery, page]);

  useEffect(() => {
    const hasPendingMedia = mediaList.some(
      m => m.uploadStatus === 'PROCESSING' || m.uploadStatus === 'UPLOADING' || m.uploadStatus === 'DELETING'
    );

    if (hasPendingMedia) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchMedia();
        }, 5000);
      }
    } else {
      if (pollingIntervalRef.current) {
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

  const handleCopyShareLink = (token: string) => {
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleStartRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenamingTitle(title);
  };

  const handleRenameSubmit = (id: string) => {
    handleRename(id, renamingTitle);
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-1">
            {activeWorkspaceName || 'Workspace Dashboard'}
          </h2>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            You have <span className="text-[var(--primary)]">{totalMedia}</span> captures in this workspace.
          </p>
        </div>
      </div>

      <MediaToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isGridView={isGridView}
        onViewToggle={setIsGridView}
        onPageChange={setPage}
      />

      {sortedMedia.length === 0 ? (
        <MediaEmptyState />
      ) : isGridView ? (
        <MediaGrid
          media={sortedMedia}
          renamingId={renamingId}
          renamingTitle={renamingTitle}
          onRename={handleRenameSubmit}
          onStartRename={handleStartRename}
          onDelete={handleDelete}
          onVisibilityChange={handleVisibilityChange}
          onShareLink={handleShareLink}
          onView={setActiveMediaViewer}
        />
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Uploader</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Size</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Visibility</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMedia.map((item) => {
                const isReady = item.uploadStatus === 'READY';
                const isDeleting = item.uploadStatus === 'DELETING';
                const isPending = item.uploadStatus === 'PROCESSING' || item.uploadStatus === 'UPLOADING';

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors ${
                      isDeleting ? 'opacity-40 grayscale' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      {renamingId === item.id ? (
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          onBlur={() => handleRenameSubmit(item.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(item.id)}
                          autoFocus
                          className="bg-[var(--bg-main)] border border-[var(--primary)] text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => isReady && setActiveMediaViewer(item)}
                            className="text-sm font-bold text-white hover:text-[var(--primary)] transition-colors cursor-pointer text-left"
                            disabled={!isReady}
                          >
                            {item.title}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${
                          item.type === 'SCREENSHOT'
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                      {item.uploader.displayName}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                      {item.fileSizeBytes ? `${(item.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {isReady && (
                        <MediaVisibilitySelect
                          value={item.visibility}
                          onChange={(val) => handleVisibilityChange(item.id, val)}
                          direction="down"
                        />
                      )}
                      {isPending && (
                        <span className="text-xs text-[var(--primary)] font-bold uppercase">
                          {item.uploadStatus === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
                        </span>
                      )}
                      {isDeleting && (
                        <span className="text-xs text-red-500 font-bold uppercase">Deleting...</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isReady && renamingId !== item.id && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartRename(item.id, item.title)}
                            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1.5 cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleShareLink(item)}
                            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1.5 cursor-pointer"
                            title="Share Link"
                          >
                            <Link2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1.5 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MediaViewer 
        media={activeMediaViewer} 
        onClose={() => setActiveMediaViewer(null)} 
      />

      <PopupModal
        isOpen={!!showShareModal}
        onClose={() => setShowShareModal(null)}
        title="Share Capture"
        variant="custom"
        maxWidth="md"
      >
        <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
          Anyone with this link can view this capture. You can revoke access anytime.
        </p>

        <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-4 flex items-center gap-3">
          <Link2 size={18} className="text-[var(--primary)] shrink-0" />
          <input
            type="text"
            readOnly
            value={showShareModal && typeof window !== 'undefined' ? `${window.location.origin}/s/${showShareModal.shareToken}` : ''}
            className="flex-1 bg-transparent text-sm text-white outline-none font-mono"
          />
          <button
            onClick={() => showShareModal && handleCopyShareLink(showShareModal.shareToken!)}
            className="btn-primary py-1.5 px-4 text-xs rounded-lg cursor-pointer shrink-0"
          >
            Copy
          </button>
        </div>
      </PopupModal>
    </div>
  );
}
