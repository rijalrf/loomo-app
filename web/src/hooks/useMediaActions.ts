import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/clientLogger';
import { showLoadingAlert, hideLoadingAlert } from '@/components/LoadingAlert';

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

interface UseMediaActionsReturn {
  handleRename: (id: string, newTitle: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleVisibilityChange: (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => Promise<void>;
  handleShareLink: (media: Media) => Promise<void>;
  handleRevokeShare: (media: Media) => Promise<void>;
  retryUpload: (id: string) => Promise<void>;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  showShareModal: Media | null;
  setShowShareModal: (media: Media | null) => void;
  showDeleteModal: string | null;
  setShowDeleteModal: (id: string | null) => void;
  confirmDelete: (id: string) => Promise<void>;
  showRevokeModal: Media | null;
  setShowRevokeModal: (media: Media | null) => void;
  confirmRevoke: (media: Media) => Promise<void>;
}

export function useMediaActions(
  mediaList: Media[],
  setMediaList: React.Dispatch<React.SetStateAction<Media[]>>,
  fetchMedia: () => Promise<void>
): UseMediaActionsReturn {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<Media | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState<Media | null>(null);

  const handleRename = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    const loadingId = showLoadingAlert('Renaming media...');
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === id ? { ...m, title: newTitle } : m));
        setRenamingId(null);
        hideLoadingAlert(loadingId);
        toast.success('Media renamed successfully');
      } else {
        hideLoadingAlert(loadingId);
        toast.error('Failed to rename media');
      }
    } catch (e) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to rename media');
      clientLogger.error('media-actions', 'Failed to rename media:', e);
    }
  };

  const handleDelete = async (id: string) => {
    setShowDeleteModal(id);
  };

  const confirmDelete = async (id: string) => {
    setShowDeleteModal(null);
    setMediaList(prev => prev.map(m => m.id === id ? { ...m, uploadStatus: 'DELETING' as const } : m));

    const loadingId = showLoadingAlert('Deleting media...');
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        hideLoadingAlert(loadingId);
        toast.error('Failed to delete media');
        fetchMedia();
      } else {
        setMediaList(prev => prev.filter(m => m.id !== id));
        hideLoadingAlert(loadingId);
        toast.success('Media deleted successfully');
      }
    } catch (e) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to delete media');
      clientLogger.error('media-actions', 'Failed to delete media:', e);
      fetchMedia();
    }
  };

  const retryUpload = async (id: string) => {
    const loadingId = showLoadingAlert('Retrying upload...');
    try {
      const res = await fetch(`/api/media/${id}/retry`, {
        method: 'POST'
      });
      
      if (res.ok) {
        toast.success('Upload retried successfully');
        fetchMedia();
      } else {
        toast.error('Failed to retry upload');
      }
    } catch (e) {
      toast.error('Connection error');
      clientLogger.error('media-actions', 'Failed to retry upload:', e);
    } finally {
      hideLoadingAlert(loadingId);
    }
  };

  const handleVisibilityChange = async (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => {
    const loadingId = showLoadingAlert('Updating visibility...');
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility })
      });
      
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === id ? { ...m, visibility } : m));
        hideLoadingAlert(loadingId);
        toast.success('Visibility updated');
      } else {
        hideLoadingAlert(loadingId);
        toast.error('Failed to update visibility');
      }
    } catch (e) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to update visibility');
      clientLogger.error('media-actions', 'Failed to change media visibility:', e);
    }
  };

  const handleShareLink = async (media: Media) => {
    if (media.shareToken) {
      setShowShareModal(media);
    } else {
      const loadingId = showLoadingAlert('Generating share link...');
      try {
        const res = await fetch(`/api/media/${media.id}/share`, {
          method: 'POST'
        });
        
        if (res.ok) {
          const data = await res.json();
          const updatedMedia = { ...media, shareToken: data.shareToken, visibility: data.visibility };
          setMediaList(prev => prev.map(m => m.id === media.id ? updatedMedia : m));
          setShowShareModal(updatedMedia);
          hideLoadingAlert(loadingId);
          toast.success('Share link generated successfully');
        } else {
          hideLoadingAlert(loadingId);
          toast.error('Failed to generate share link');
        }
      } catch (e) {
        hideLoadingAlert(loadingId);
        toast.error('Failed to generate share link');
        clientLogger.error('media-actions', 'Failed to create share link:', e);
      }
    }
  };

  const handleRevokeShare = async (media: Media) => {
    setShowRevokeModal(media);
  };

  const confirmRevoke = async (media: Media) => {
    setShowRevokeModal(null);

    const loadingId = showLoadingAlert('Revoking share link...');
    try {
      const res = await fetch(`/api/media/${media.id}/share`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === media.id ? { ...m, shareToken: null, visibility: 'PRIVATE' } : m));
        setShowShareModal(null);
        hideLoadingAlert(loadingId);
        toast.success('Share link revoked successfully');
      } else {
        hideLoadingAlert(loadingId);
        toast.error('Failed to revoke share link');
      }
    } catch (e) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to revoke share link');
      clientLogger.error('media-actions', 'Failed to revoke share link:', e);
    }
  };

  return {
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
  };
}
