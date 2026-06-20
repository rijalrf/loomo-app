'use client';

import { useState, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/clientLogger';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import MediaToolbar from '../media/MediaToolbar';
import MediaGrid from '../media/MediaGrid';
import MediaEmptyState from '../media/MediaEmptyState';
import PopupModal from '../PopupModal';
import { Link2, X } from 'lucide-react';
import { toast } from 'sonner';

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
    <>
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
        <div className="text-center text-slate-400 py-20">
          List view coming soon...
        </div>
      )}

      {activeMediaViewer && (
        <div className="fixed inset-0 bg-[#0c0c0e]/95 z-[100] flex flex-col backdrop-blur-sm">
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

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowShareModal(null)}
            className="flex-1 btn-secondary py-2 px-4 rounded-lg cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => showShareModal && handleRevokeShare(showShareModal)}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 px-4 rounded-lg font-bold transition-all cursor-pointer"
          >
            Revoke Link
          </button>
        </div>
      </PopupModal>
    </>
  );
}
