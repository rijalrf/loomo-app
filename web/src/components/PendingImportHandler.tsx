'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVideoFromIndexedDB, deleteVideoFromIndexedDB } from '../lib/indexeddb';
import { clientLogger } from '@/lib/clientLogger';

export default function PendingImportHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    title: string;
    progress: string;
    error: string | null;
  }>({
    isUploading: false,
    title: '',
    progress: '',
    error: null
  });

  const driveFileId = searchParams.get('driveFileId');

  useEffect(() => {
    if (!driveFileId) return;

    const metadataKey = `jam_meta_${driveFileId}`;
    const rawMetadata = localStorage.getItem(metadataKey);
    if (!rawMetadata) return;

    try {
      const metadata = JSON.parse(rawMetadata);
      
      if (metadata.type === 'screenshot' || metadata.type === 'recording') {
        const isPopup = searchParams.get('isPopup') === 'true';
        router.push(`/editor?id=${driveFileId}${isPopup ? '&isPopup=true' : ''}`);
      }
    } catch (e) {
      clientLogger.error('pending-import-handler', 'Failed to parse pending import metadata:', e);
    }
  }, [driveFileId, router, searchParams]);

  const handleVideoUpload = async (id: string, metadata: any) => {
    setUploadState({
      isUploading: true,
      title: metadata.title || 'Screen Recording',
      progress: 'Reading recording from local storage...',
      error: null
    });

    try {
      // 1. Get video blob from IndexedDB
      const videoBlob = await getVideoFromIndexedDB(id);
      if (!videoBlob) {
        throw new Error('Video recording not found in browser local database. Please try capturing again.');
      }

      setUploadState(prev => ({ ...prev, progress: 'Uploading recording to server...' }));

      // 2. Resolve workspaceId
      const savedWorkspaceId = localStorage.getItem('loomo_active_workspace_id') || undefined;

      // 3. Call upload endpoint with multipart/form-data to queue in BackgroundJob
      const formData = new FormData();
      formData.append('file', videoBlob, `${id}.webm`);
      formData.append('title', metadata.title || 'Screen Recording');
      formData.append('type', 'recording');
      if (savedWorkspaceId) {
        formData.append('workspaceId', savedWorkspaceId);
      }
      if (metadata.duration) {
        formData.append('durationSeconds', String(metadata.duration));
      }

      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json();
        throw new Error(errJson.error || 'Server upload failed');
      }

      const { mediaId } = await uploadRes.json();

      setUploadState(prev => ({ ...prev, progress: 'Generating public share link...' }));

      // 4. Generate public share link
      const shareRes = await fetch(`/api/media/${mediaId}/share`, {
        method: 'POST'
      });

      if (shareRes.ok) {
        const shareData = await shareRes.json();
        const shareLink = `${window.location.origin}/s/${shareData.shareToken}`;
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareLink);
        } catch (clipErr) {
          console.warn('Failed to copy to clipboard automatically:', clipErr);
        }
      }

      setUploadState(prev => ({ ...prev, progress: 'Upload started in background! Closing...' }));

      // 5. Success behavior
      const isPopup = searchParams.get('isPopup') === 'true';
      if (isPopup) {
        window.dispatchEvent(new CustomEvent('loomo_close_window'));
        setTimeout(() => {
          window.close();
        }, 800);
      } else {
        setTimeout(() => {
          router.push('/');
          window.location.reload();
        }, 800);
      }


    } catch (err: any) {
      clientLogger.error('pending-import-handler', 'Video upload failed:', err);
      setUploadState(prev => ({
        ...prev,
        progress: '',
        error: err.message || 'An error occurred during upload.'
      }));
    }
  };

  if (!uploadState.isUploading) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay)]/90 backdrop-blur-md z-[99999] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="glass-panel p-10 rounded-xl max-w-md w-full text-center border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-300">
        <h3 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Uploading Recording</h3>
        <p className="text-slate-400 text-sm mb-8 font-medium truncate">
          {uploadState.title}
        </p>

        {uploadState.error ? (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 text-sm font-medium text-left flex items-start gap-3">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {uploadState.error}
            </div>
            <button 
              className="btn-primary w-full py-3 rounded-lg justify-center font-bold"
              onClick={() => {
                localStorage.removeItem(`jam_meta_${driveFileId}`);
                router.push('/');
              }}
            >
              Cancel & Return
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin mb-6"></div>
            <div className="text-sm font-black text-[var(--primary)] uppercase tracking-widest">
              {uploadState.progress}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
