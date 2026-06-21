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

  const hasDescription = !!media.description;

  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay-dark)]/95 z-[100] flex flex-col backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 shrink-0">
        <div>
          <h3 className="text-lg font-black text-white leading-tight">{media.title}</h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold uppercase tracking-widest">
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

      {/* Body: media + optional description sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Media area */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden">
          {media.type === 'SCREENSHOT' ? (
            <img
              src={`/api/media/${media.id}/file`}
              alt={media.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={`/api/media/${media.id}/file`}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Description sidebar — only shown if description exists */}
        {hasDescription && (
          <div className="w-72 shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)]/60 backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)]">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                {media.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}