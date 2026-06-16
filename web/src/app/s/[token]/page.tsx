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

  return {
    title: `${media.title} - Loomo`,
    description: 'Shared visual feedback capture - Show, don\'t just tell.',
    openGraph: {
      title: `${media.title} - Loomo`,
      description: 'Shared visual feedback capture - Show, don\'t just tell.',
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0B0F19',
      color: '#F8FAFC',
      fontFamily: 'sans-serif'
    }}>
      {/* Mini Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #232D3F',
        backgroundColor: '#131B2E'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            boxShadow: '0 0 8px var(--primary)'
          }}></div>
          <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em' }}>Loomo</span>
        </div>

        <Link href="/" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
          Get Loomo App
        </Link>
      </header>

      {/* Main View Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Media Details Card Header */}
        <div style={{ width: '100%', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0' }}>{media.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
              <span>Shared by {media.uploader.displayName}</span>
              <span>•</span>
              <span>{new Date(media.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <a 
            href={fileUrl} 
            download={media.title}
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
          >
            Download Original
          </a>
        </div>

        {/* Media Container */}
        <div className="glass-panel" style={{
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#070A13',
          border: '1px solid #232D3F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          marginBottom: '40px'
        }}>
          {media.type === 'SCREENSHOT' ? (
            <img 
              src={fileUrl} 
              alt={media.title}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <video 
              src={fileUrl}
              controls
              autoPlay
              style={{
                width: '100%',
                maxHeight: '75vh',
                display: 'block',
                backgroundColor: 'black'
              }}
            />
          )}
        </div>

        {/* Call to Action Footer */}
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '30px',
          borderRadius: '16px',
          backgroundColor: '#131B2E',
          border: '1px solid #232D3F'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '700' }}>Want to capture visual feedback like this?</h3>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Loomo is a lightweight Chrome extension that lets you capture screens, annotate, and record walkthroughs. 100% stored in your own Google Drive.
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 20px' }}>
            Get Loomo Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        fontSize: '12px',
        color: '#64748B',
        borderTop: '1px solid #232D3F'
      }}>
        Powering async feedback. Loomo © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function renderErrorPage(title: string, message: string, status: number) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0B0F19',
      color: '#F8FAFC',
      fontFamily: 'sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div className="glass-panel" style={{
        padding: '40px 30px',
        borderRadius: '16px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
        border: '1px solid #232D3F'
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: status === 202 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: status === 202 ? '#F59E0B' : '#EF4444'
        }}>
          {status === 202 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="glow-animation">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px 0' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 24px 0', lineHeight: '1.6' }}>{message}</p>

        <Link href="/" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
          Back to Loomo Home
        </Link>
      </div>
    </div>
  );
}
