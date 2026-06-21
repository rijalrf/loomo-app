'use client';

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

interface MediaViewerProps {
  media: Media | null;
  onClose: () => void;
}

export default function MediaViewer({ media, onClose }: MediaViewerProps) {
  if (!media) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay-dark)]/95 z-[100] flex flex-col backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50">
        <div>
          <h3 className="text-lg font-black text-white leading-tight">{media.title}</h3>
          <p className="text-xs text-[var(--text-muted)] font-medium">
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

      <div className="flex-1 flex items-center justify-center p-0.5 md:p-1 overflow-y-auto">
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
    </div>
  );
}