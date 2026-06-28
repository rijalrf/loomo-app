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
import { Link2, X, Edit2, Trash2, Folder, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { showLoadingAlert, hideLoadingAlert } from '@/components/LoadingAlert';
import MediaVisibilitySelect from '../ui/MediaVisibilitySelect';
import Dropdown from '../ui/Dropdown';

interface Media {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  uploadedBy: string;
  title: string;
  description?: string | null;
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
  activeFolderId: string | null;
}

export default function DashboardContent({
  activeWorkspaceId,
  activeWorkspaceName,
  initialMedia,
  activeFolderId
}: DashboardContentProps) {
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [totalMedia, setTotalMedia] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [activeMediaViewer, setActiveMediaViewer] = useState<Media | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Folder Move States
  const [showMoveModal, setShowMoveModal] = useState<Media | null>(null);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [isMovingMedia, setIsMovingMedia] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const fetchFoldersForMove = async () => {
    if (!activeWorkspaceId) return;
    setIsFoldersLoading(true);
    try {
      const res = await fetch(`/api/workspace/folders?workspaceId=${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    } finally {
      setIsFoldersLoading(false);
    }
  };

  useEffect(() => {
    if (showMoveModal) {
      setSelectedFolderId(showMoveModal.folderId || null);
      fetchFoldersForMove();
    } else {
      setSelectedFolderId(null);
    }
  }, [showMoveModal]);

  const handleMoveMedia = async (folderId: string | null) => {
    if (!showMoveModal) return;
    setIsMovingMedia(true);
    const loadingId = showLoadingAlert('Moving media...');
    try {
      const res = await fetch(`/api/media/${showMoveModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId || null })
      });
      if (res.ok) {
        toast.success(folderId ? 'Media moved to project' : 'Media removed from project');
        setShowMoveModal(null);
        fetchMedia();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to move media');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setIsMovingMedia(false);
      hideLoadingAlert(loadingId);
    }
  };

  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterVisibility,
    setFilterVisibility,
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
    setShowShareModal,
    showDeleteModal,
    setShowDeleteModal,
    confirmDelete,
    showRevokeModal,
    setShowRevokeModal,
  confirmRevoke,
  retryUpload
} = useMediaActions(mediaList, setMediaList, fetchMedia);


  const [renamingTitle, setRenamingTitle] = useState('');

  async function fetchMedia() {
    if (!activeWorkspaceId) return;

    try {
      const params = new URLSearchParams();
      params.append('workspaceId', activeWorkspaceId);
      if (filterType !== 'ALL') params.append('type', filterType);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterVisibility !== 'ALL') params.append('visibility', filterVisibility);
      if (searchQuery) params.append('search', searchQuery);
      if (activeFolderId) params.append('folderId', activeFolderId);
      params.append('page', page.toString());
      params.append('limit', '12');
      params.append('sortBy', sortBy);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
        setTotalMedia(data.total || 0);
        const calculatedTotalPages = data.totalPages || 1;
        setTotalPages(calculatedTotalPages);
        if (page > calculatedTotalPages && calculatedTotalPages > 0) {
          setPage(calculatedTotalPages);
        }
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
  }, [activeWorkspaceId, filterType, filterStatus, filterVisibility, searchQuery, page, activeFolderId, sortBy]);

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
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterVisibility={filterVisibility}
        onFilterVisibilityChange={setFilterVisibility}
        sortBy={sortBy}
        onSortChange={(sort) => {
          setSortBy(sort);
          setPage(1);
        }}
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
          onMoveClick={setShowMoveModal}
          onRetry={retryUpload}
        />
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-visible relative">
          <table className="w-full">
            <thead className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
              <tr>
                <th className="rounded-tl-lg text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Uploader</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Size</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Visibility</th>
                <th className="rounded-tr-lg text-right py-3 px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMedia.map((item, index) => {
                const isReady = item.uploadStatus === 'READY';
                const isDeleting = item.uploadStatus === 'DELETING';
                const isPending = item.uploadStatus === 'PROCESSING' || item.uploadStatus === 'UPLOADING';
                const dropdownDirection = index >= Math.floor(sortedMedia.length / 2) ? 'up' : 'down';

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
                          direction={dropdownDirection}
                        />
                      )}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--primary)] font-bold uppercase">
                            {item.uploadStatus === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
                          </span>
                          {item.uploadStatus === 'PROCESSING' && (
                            <button
                              onClick={() => retryUpload(item.id)}
                              className="text-[10px] text-[var(--text-muted)] hover:text-white underline cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      )}
                      {isDeleting && (
                        <span className="text-xs text-red-500 font-bold uppercase">Deleting...</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isReady && renamingId !== item.id && (
                        <div className="flex justify-end">
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="text-[var(--text-muted)] hover:text-white transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-[var(--bg-hover)]"
                                title="Actions"
                                onClick={(e) => {
                                  console.log('[ActionsTrigger] clicked for item:', item.id);
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                            }
                            isOpen={activeDropdownId === item.id}
                            onOpenChange={(open) => {
                              console.log('[onOpenChange] open state:', open, 'for item:', item.id);
                              setActiveDropdownId(open ? item.id : null);
                            }}
                            align="right"
                            direction={dropdownDirection}
                          >
                            <div className="w-48 py-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Dropdown] Rename clicked for item:', item.id);
                                  handleStartRename(item.id, item.title);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors cursor-pointer rounded-lg"
                              >
                                <Edit2 size={14} />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Dropdown] Move clicked for item:', item.id);
                                  setShowMoveModal(item);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors cursor-pointer rounded-lg"
                              >
                                <Folder size={14} />
                                <span>Move to Project</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Dropdown] Share clicked for item:', item.id);
                                  handleShareLink(item);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors cursor-pointer rounded-lg"
                              >
                                <Link2 size={14} />
                                <span>Share Link</span>
                              </button>
                              <div className="border-t border-[var(--border-color)] my-1" />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Dropdown] Delete clicked for item:', item.id);
                                  handleDelete(item.id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer rounded-lg"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </Dropdown>
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

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-1 py-4 border-t border-[var(--border-color)] gap-4 font-sans">
          <div className="text-sm text-[var(--text-muted)] font-medium">
            Showing <span className="text-white font-bold">{Math.min(totalMedia, (page - 1) * 12 + 1)}</span> to{' '}
            <span className="text-white font-bold">{Math.min(totalMedia, page * 12)}</span> of{' '}
            <span className="text-white font-bold">{totalMedia}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                page === 1
                  ? 'opacity-40 cursor-not-allowed text-[var(--text-dark)] bg-transparent'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white border border-[var(--border-color)] bg-[var(--bg-card)]'
              }`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, page - 2);
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        page === i
                          ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)] border border-[var(--primary)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white border border-[var(--border-color)] bg-[var(--bg-card)]'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                page === totalPages
                  ? 'opacity-40 cursor-not-allowed text-[var(--text-dark)] bg-transparent'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white border border-[var(--border-color)] bg-[var(--bg-card)]'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <MediaViewer 
        media={activeMediaViewer} 
        onClose={() => setActiveMediaViewer(null)} 
      />

      <PopupModal
        isOpen={!!showShareModal}
        onClose={() => setShowShareModal(null)}
        maxWidth="md"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Share Capture</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
          Anyone with this link can view this capture. You can revoke access anytime.
        </p>

        <div className="bg-[#0a0a0b] border border-[#3f3f46] rounded-lg p-4 flex items-center gap-3 mb-6">
          <Link2 size={18} className="text-[#3b82f6] shrink-0" />
          <input
            type="text"
            readOnly
            value={showShareModal && typeof window !== 'undefined' ? `${window.location.origin}/s/${showShareModal.shareToken}` : ''}
            className="flex-1 bg-transparent text-sm text-white outline-none font-mono"
          />
          <button
            onClick={() => showShareModal && handleCopyShareLink(showShareModal.shareToken!)}
            className="bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white py-1.5 px-4 text-xs rounded-lg cursor-pointer shrink-0 font-semibold transition-all"
          >
            Copy
          </button>
        </div>

        <button
          onClick={() => showShareModal && handleRevokeShare(showShareModal)}
          className="text-sm text-[#ef4444] hover:text-[#dc2626] transition-colors font-medium cursor-pointer"
        >
          Revoke Link
        </button>
      </PopupModal>

      <PopupModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Delete Media</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
          Are you sure you want to delete this media? This will permanently delete it from Loomo and your Google Drive.
        </p>

        <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowDeleteModal(null)}
          className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => showDeleteModal && confirmDelete(showDeleteModal)}
          className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
        >
          Delete
        </button>
        </div>
      </PopupModal>

      <PopupModal
        isOpen={!!showRevokeModal}
        onClose={() => setShowRevokeModal(null)}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Revoke Share Link</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
          Revoking this link will deactivate the current share URL. Anyone visiting it will lose access. Proceed?
        </p>

        <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowRevokeModal(null)}
          className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => showRevokeModal && confirmRevoke(showRevokeModal)}
          className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
        >
          Revoke
        </button>
        </div>
      </PopupModal>

      {/* Move to Project Modal */}
      <PopupModal
        isOpen={showMoveModal !== null}
        onClose={() => setShowMoveModal(null)}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Move to Project</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed font-sans">
          Choose a project in this workspace to organize <span className="text-white font-bold">"{showMoveModal?.title}"</span>.
        </p>

        <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar mb-6 font-sans">
          <button
            onClick={() => setSelectedFolderId(null)}
            disabled={isMovingMedia}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm font-bold transition-all cursor-pointer ${
              selectedFolderId === null
                ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
            }`}
          >
            <Folder size={14} className="opacity-50 shrink-0" />
            <span className="truncate flex-1">None (Unassigned)</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              disabled={isMovingMedia}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm font-bold transition-all cursor-pointer ${
                selectedFolderId === folder.id
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
              }`}
            >
              <Folder size={14} className="shrink-0" />
              <span className="truncate flex-1">{folder.name}</span>
            </button>
          ))}

          {folders.length === 0 && !isFoldersLoading && (
            <p className="text-xs text-[var(--text-muted)] italic py-2">No folders in this workspace. Create one in the sidebar!</p>
          )}
          {isFoldersLoading && (
            <p className="text-xs text-[var(--text-muted)] italic py-2">Loading folders...</p>
          )}
        </div>

        <div className="flex gap-3 justify-end font-sans">
          <button
            onClick={() => setShowMoveModal(null)}
            disabled={isMovingMedia}
            className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => handleMoveMedia(selectedFolderId)}
            disabled={isMovingMedia || (showMoveModal?.folderId || null) === selectedFolderId}
            className="px-4 py-2 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] hover:from-[#2563eb] hover:to-[#1e40af] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Move
          </button>
        </div>
      </PopupModal>
    </div>
  );
}
