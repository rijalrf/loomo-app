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

      setUploadState(prev => ({ ...prev, progress: 'Uploading to Loomo server...' }));

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('file', videoBlob, `${id}.webm`);
      formData.append('title', metadata.title);
      formData.append('type', 'recording');
      formData.append('durationSeconds', String(metadata.duration || 0));
      
      const savedWorkspaceId = localStorage.getItem('loomo_active_workspace_id');
      if (savedWorkspaceId) {
        formData.append('workspaceId', savedWorkspaceId);
      }
      
      if (metadata.systemInfo?.viewportSize) {
        const [w, h] = metadata.systemInfo.viewportSize.split('x');
        formData.append('width', w);
        formData.append('height', h);
      }

      // 3. Send upload request
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server upload failed');
      }

      const uploadResult = await response.json();
      const mediaId = uploadResult.mediaId;

      setUploadState(prev => ({ ...prev, progress: 'Generating public share link...' }));

      // 3b. Generate public share link
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

      setUploadState(prev => ({ ...prev, progress: 'Upload complete! Finalizing...' }));

      // 4. Cleanup local storage and IndexedDB
      localStorage.removeItem(`jam_meta_${id}`);
      await deleteVideoFromIndexedDB(id);

      // 5. Success behavior
      const isPopup = searchParams.get('isPopup') === 'true';
      if (isPopup) {
        window.dispatchEvent(new CustomEvent('loomo_close_window'));
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        setTimeout(() => {
          router.push('/');
          window.location.reload();
        }, 1000);
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 15, 25, 0.9)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div className="glass-panel" style={{
        padding: '30px',
        borderRadius: '16px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Uploading Tab Recording</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
          {uploadState.title}
        </p>

        {uploadState.error ? (
          <div>
            <div style={{
              color: 'var(--error)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'left'
            }}>
              {uploadState.error}
            </div>
            <button 
              className="btn-primary" 
              onClick={() => {
                localStorage.removeItem(`jam_meta_${driveFileId}`);
                router.push('/');
              }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Cancel & Back to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="glow-animation" style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 20px auto'
            }}></div>
            <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>
              {uploadState.progress}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
