'use client';

import { Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaEmptyState() {
  return (
    <div className="glass-panel py-16 px-6 rounded-lg text-center border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-main)] flex items-center justify-center mb-6 border border-[var(--border-color)]">
        <ImageIcon className="text-[var(--text-muted)]" size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No captures yet</h3>
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        Use the Loomo Chrome Extension to take screenshots or record your screen. They will automatically appear here.
      </p>
      <button
        onClick={() => toast.info('Load the "extension" folder in Chrome Developer mode.')}
        className="btn-primary cursor-pointer py-2 px-5 text-sm"
      >
        Get Extension
      </button>
    </div>
  );
}
