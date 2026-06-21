import { Metadata } from 'next';
import { prisma } from '../../../lib/db';
import { getSession } from '../../../lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

// Generate Dynamic SEO Metadata (Open Graph Tags)
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  
  const media = await prisma.media.findUnique({
    where: { shareToken: token },
    select: {
      title: true,
      description: true,
      type: true,
      driveThumbnailUrl: true
    }
  });

  if (!media) {
    return {
      title: 'Media Not Found - Loomo',
      description: 'The requested capture was not found or has been deleted.'
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8999';
  const fileUrl = `${appUrl}/api/share/${token}/file`;

  const seoDesc = media.description || 'Shared visual feedback capture - Show, don\'t just tell.';

  return {
    title: `${media.title} - Loomo`,
    description: seoDesc,
    openGraph: {
      title: `${media.title} - Loomo`,
      description: seoDesc,
      type: media.type === 'RECORDING' ? 'video.other' : 'website',
      images: [
        {
          url: media.type === 'SCREENSHOT' ? fileUrl : media.driveThumbnailUrl || `${appUrl}/video-placeholder.png`,
          width: 1200,
          height: 630,
          alt: media.title
        }
      ],
      videos: media.type === 'RECORDING' ? [{ url: fileUrl }] : undefined
    }
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // 1. Fetch media directly from DB
  const media = await prisma.media.findUnique({
    where: { shareToken: token },
    include: {
      workspace: {
        include: {
          members: true
        }
      },
      uploader: {
        select: {
          displayName: true,
          avatarUrl: true
        }
      }
    }
  });

  if (!media || media.deletedAt) {
    return renderErrorPage('Capture Not Found', 'The shared link you followed does not exist, or the media has been deleted by its owner.', 404);
  }

  if (media.uploadStatus !== 'READY') {
    return renderErrorPage('Processing Capture', 'This capture is currently being processed and uploaded to Google Drive. Please refresh this page in a moment.', 202);
  }

  // 2. Enforce visibility permissions
  if (media.visibility === 'PRIVATE') {
    return renderErrorPage('Private Content', 'This capture is marked as private and cannot be viewed via public links.', 403);
  }

  if (media.visibility === 'WORKSPACE_ONLY') {
    const session = await getSession();
    if (!session) {
      // Prompt user to sign in
      redirect(`/api/auth/google`);
    }

    const isMember = media.workspace.members.some(m => m.userId === session.userId);
    if (!isMember) {
      return renderErrorPage('Access Denied', 'This capture is restricted to members of the workspace. You do not have permission to view this content.', 403);
    }
  }

  const fileUrl = `/api/share/${token}/file`;

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-xl z-10 shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Loomo Logo" className="w-6 h-6 object-contain transition-transform group-hover:scale-110" />
            <span className="text-base font-black tracking-tighter text-white">Loomo</span>
          </Link>
          
          <div className="w-px h-6 bg-[var(--border-color)]"></div>
          
          {/* Title & Metadata */}
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">{media.title}</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              By {media.uploader.displayName} • {new Date(media.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <a 
            href={fileUrl} 
            download={media.title}
            className="btn-primary py-2 px-4 text-xs rounded-lg gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="font-bold">Download</span>
          </a>
        </div>
      </div>

      {/* Body: media + optional description sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Media area */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden">
          {media.type === 'SCREENSHOT' ? (
            <img 
              src={fileUrl} 
              alt={media.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <video 
              src={fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Description sidebar — only shown if description exists */}
        {media.description && (
          <div className="w-72 shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)]/60 backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)]">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
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

function renderErrorPage(title: string, message: string, status: number) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] font-sans p-6 text-center">
      <div className="glass-panel p-10 rounded-xl max-w-md w-full border border-[var(--border-color)] shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${status === 202 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {status === 202 ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed font-medium">{message}</p>

        <Link href="/" className="btn-secondary w-full py-3 rounded-lg justify-center font-bold">
          Back to Loomo Home
        </Link>
      </div>
    </div>
  );
}
