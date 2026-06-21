import { Suspense } from 'react';
import EditorClient from '../../components/EditorClient';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-overlay)] text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-[var(--primary)] rounded-full animate-spin"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Loading Loomo Editor...</p>
        </div>
      </div>
    }>
      <EditorClient />
    </Suspense>
  );
}
