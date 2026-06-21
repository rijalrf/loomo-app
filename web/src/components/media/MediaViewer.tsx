'use client';

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

interface MediaViewerProps {
  media: Media | null;
  onClose: () => void;
}

export default function MediaViewer({ media, onClose }: MediaViewerProps) {
  if (!media) return null;
  console.log('MediaViewer rendered with media:', media);

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay-dark)]/95 z-[100] flex flex-col backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50">
        <div>
          <h3 className="text-lg font-black text-white leading-tight">{media.title}</h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-bold uppercase tracking-widest">
            Captured by {media.uploader.displayName} • {new Date(media.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="btn-secondary py-2 px-6 rounded-full border-[var(--border-color)] hover:bg-white hover:text-black hover:border-white transition-all font-bold cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-0.5 md:p-1 m-[10px] overflow-y-auto">
          {media.type === 'SCREENSHOT' ? (
            <img
              src={`/api/media/${media.id}/file`}
              alt={media.title}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={`/api/media/${media.id}/file`}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {media.description && (
          <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-[var(--border-color)] bg-[var(--bg-card)]/30 p-6 overflow-y-auto">
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Description</h4>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
              {media.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}