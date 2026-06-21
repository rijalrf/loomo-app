'use client';

import { Play } from 'lucide-react';

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

interface MediaCardProps {
  media: Media;
  onView: (media: Media) => void;
  children?: React.ReactNode;
}

export default function MediaCard({ media, onView, children }: MediaCardProps) {
  const isDeleting = media.uploadStatus === 'DELETING';
  const isReady = media.uploadStatus === 'READY';
  const isFailed = media.uploadStatus === 'FAILED';
  const isPending = media.uploadStatus === 'PROCESSING' || media.uploadStatus === 'UPLOADING';

  return (
    <div
      className={`media-card flex flex-col h-full bg-[var(--bg-main)] border-[var(--border-color)] group ${
        isDeleting ? 'opacity-40 grayscale pointer-events-none' : ''
      }`}
    >
      <div
        className="relative pt-[56.25%] bg-slate-950 cursor-pointer overflow-hidden rounded-t-md"
        onClick={() => isReady && onView(media)}
      >
        {isReady ? (
          <>
            <img
              src={`/api/media/${media.id}/thumbnail`}
              alt={media.title}
              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {media.type === 'RECORDING' && (
              <>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/90 flex items-center justify-center text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-bold">
                  {Math.floor(media.durationSeconds / 60)}:{String(media.durationSeconds % 60).padStart(2, '0')}
                </span>
              </>
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
                  {media.uploadStatus === 'UPLOADING' ? 'Uploading...' : 'Processing...'}
                </span>
              </>
            )}
            {isFailed && (
              <>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <span className="text-2xl">⚠️</span>
                </div>
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase">Upload Failed</span>
              </>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
