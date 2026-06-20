'use client';

import { useState } from 'react';
import { Edit2, Trash2, Link2, Download, Eye, MoreHorizontal } from 'lucide-react';
import MediaCard from './MediaCard';
import MediaVisibilitySelect from '../ui/MediaVisibilitySelect';

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

interface MediaGridProps {
  media: Media[];
  renamingId: string | null;
  renamingTitle: string;
  onRename: (id: string, title: string) => void;
  onStartRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onVisibilityChange: (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => void;
  onShareLink: (media: Media) => void;
  onView: (media: Media) => void;
}

export default function MediaGrid({
  media,
  renamingId,
  renamingTitle,
  onRename,
  onStartRename,
  onDelete,
  onVisibilityChange,
  onShareLink,
  onView
}: MediaGridProps) {
  return (
    <div className="media-grid">
      {media.map((item) => {
        const isReady = item.uploadStatus === 'READY';

        return (
          <MediaCard key={item.id} media={item} onView={onView}>
            <div className="p-4 flex flex-col flex-1">
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${
                    item.type === 'SCREENSHOT'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'bg-purple-500/10 text-purple-400'
                  }`}
                >
                  {item.type}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 mb-3">
                {renamingId === item.id ? (
                  <input
                    type="text"
                    value={renamingTitle}
                    onChange={(e) => onStartRename(item.id, e.target.value)}
                    onBlur={() => onRename(item.id, renamingTitle)}
                    onKeyDown={(e) => e.key === 'Enter' && onRename(item.id, renamingTitle)}
                    autoFocus
                    className="bg-[var(--bg-main)] border border-[var(--primary)] text-white text-sm font-bold px-2 py-1 rounded w-full outline-none"
                  />
                ) : (
                  <h4
                    className="text-sm font-bold text-[var(--text-main)] truncate flex-1 hover:text-[var(--primary)] transition-colors cursor-pointer"
                    onClick={() => isReady && onView(item)}
                  >
                    {item.title}
                  </h4>
                )}

                {isReady && renamingId !== item.id && (
                  <button
                    onClick={() => onStartRename(item.id, item.title)}
                    className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1 cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-3">
                <span>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {item.fileSizeBytes && (
                  <span>{(item.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                )}
              </div>

              {isReady && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <MediaVisibilitySelect
                      value={item.visibility}
                      onChange={(val) => onVisibilityChange(item.id, val)}
                      direction="up"
                    />
                    {item.shareToken && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Link2 size={12} />
                        Shared
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => onShareLink(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--bg-hover)] hover:bg-[var(--primary)]/10 border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--primary)] py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Share Link"
                    >
                      <Link2 size={14} />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="flex items-center justify-center gap-1.5 bg-[var(--bg-hover)] hover:bg-red-500/10 border border-[var(--border-color)] hover:border-red-500/30 text-[var(--text-muted)] hover:text-red-400 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </MediaCard>
        );
      })}
    </div>
  );
}
