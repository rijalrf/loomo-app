import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getDriveOwnerId } from '@/lib/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!media || media.deletedAt) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Check if user is a member of the workspace
    const isMember = media.workspace.members.some(m => m.userId === session.userId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (media.uploadStatus !== 'READY') {
      return NextResponse.redirect(new URL(media.type === 'SCREENSHOT' ? '/screenshot-placeholder.svg' : '/video-placeholder.svg', request.url));
    }

    let thumbnailUrl = media.driveThumbnailUrl;

    if (media.driveFileId) {
      try {
        const { getFreshAccessToken, getFileMetadata } = await import('@/lib/gdrive');
        // Resolve correct drive owner (workspace owner or uploader)
        const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);
        const accessToken = await getFreshAccessToken(targetUserId);
        const metadata = await getFileMetadata(accessToken, media.driveFileId);
        if (metadata.thumbnailLink) {
          thumbnailUrl = metadata.thumbnailLink;
          // Update database asynchronously
          prisma.media.update({
            where: { id: media.id },
            data: { driveThumbnailUrl: thumbnailUrl }
          }).catch(() => {});
        }
      } catch (err: any) {
        logger.error('thumbnail-proxy-api', `Failed to fetch fresh thumbnailLink from Drive: ${err.message || String(err)}`);
      }
    }

    if (!thumbnailUrl) {
      return NextResponse.redirect(new URL(media.type === 'SCREENSHOT' ? '/screenshot-placeholder.svg' : '/video-placeholder.svg', request.url));
    }

    // Fetch the thumbnail image from Google Drive
    const thumbRes = await fetch(thumbnailUrl);
    if (!thumbRes.ok) {
      return NextResponse.redirect(new URL(media.type === 'SCREENSHOT' ? '/screenshot-placeholder.svg' : '/video-placeholder.svg', request.url));
    }

    return new NextResponse(thumbRes.body, {
      headers: {
        'Content-Type': thumbRes.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'private, max-age=86400' // cache thumbnail for 24 hours
      }
    });
  } catch (error: any) {
    logger.error('thumbnail-proxy-api', `Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
