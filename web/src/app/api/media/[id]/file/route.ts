import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getFreshAccessToken, fetchFileStream } from '@/lib/gdrive';
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
      return NextResponse.json({ error: 'Media is still processing' }, { status: 202 });
    }

    if (!media.driveFileId) {
      return NextResponse.json({ error: 'Drive file ID is missing' }, { status: 500 });
    }

    // Resolve correct drive owner (workspace owner or uploader)
    const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);
    const accessToken = await getFreshAccessToken(targetUserId);

    // Stream the file from Google Drive
    const driveRes = await fetchFileStream(accessToken, media.driveFileId);

    return new NextResponse(driveRes.body, {
      headers: {
        'Content-Type': media.mimeType || (media.type === 'SCREENSHOT' ? 'image/png' : 'video/webm'),
        'Content-Length': media.fileSizeBytes?.toString() || '',
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${media.title}"`
      }
    });
  } catch (error: any) {
    console.error(`[file-proxy-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
