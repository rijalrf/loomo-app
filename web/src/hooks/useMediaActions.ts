import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/clientLogger';
import { showConfirm } from '@/lib/customDialog';

interface Media {
  id: string;
  title: string;
  shareToken: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  uploadStatus: 'PROCESSING' | 'UPLOADING' | 'READY' | 'FAILED' | 'DELETING';
  [key: string]: any;
}

interface UseMediaActionsReturn {
  handleRename: (id: string, newTitle: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleVisibilityChange: (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => Promise<void>;
  handleShareLink: (media: Media) => Promise<void>;
  handleRevokeShare: (media: Media) => Promise<void>;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  showShareModal: Media | null;
  setShowShareModal: (media: Media | null) => void;
}

export function useMediaActions(
  mediaList: Media[],
  setMediaList: React.Dispatch<React.SetStateAction<Media[]>>,
  fetchMedia: () => Promise<void>
): UseMediaActionsReturn {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<Media | null>(null);

  const handleRename = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (res.ok) {
        setMediaList(prev => prev.map(m => m.id === id ? { ...m, title: newTitle } : m));
        setRenamingId(null);
        toast.success('Media renamed successfully');
      } else {
        toast.error('Failed to rename media');
      }
    } catch (e) {
      toast.error('Failed to rename media');
      clientLogger.error('media-actions', 'Failed to rename media:', e);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this media? This will permanently delete it from Loomo and your Google Drive.');
    if (!confirmed) return;

    setMediaList(prev => prev.map(m => m.id === id ? { ...m, uploadStatus: 'DELETING' as const } : m));

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        toast.error('Failed to delete media');
        fetchMedia();
      } else {
        toast.success('Media queued for deletion successfully');
      }
    } catch (e) {
      toast.error('Failed to delete media');
      clientLogger.error('media-actions', 'Failed to delete media:', e);
      fetchMedia();
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
        toast.success('Visibility updated');
      } else {
        toast.error('Failed to update visibility');
      }
    } catch (e) {
      toast.error('Failed to update visibility');
      clientLogger.error('media-actions', 'Failed to change media visibility:', e);
    }
  };

  const handleShareLink = async (media: Media) => {
    if (media.shareToken) {
      setShowShareModal(media);
    } else {
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
        clientLogger.error('media-actions', 'Failed to create share link:', e);
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
        setMediaList(prev => prev.map(m => m.id === media.id ? { ...m, shareToken: null, visibility: 'PRIVATE' } : m));
        setShowShareModal(null);
        toast.success('Share link revoked successfully');
      } else {
        toast.error('Failed to revoke share link');
      }
    } catch (e) {
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
    setShowShareModal
  };
}
