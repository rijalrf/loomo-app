import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getFreshAccessToken, fetchFileStream } from '@/lib/gdrive';
import { getDriveOwnerId } from '@/lib/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const media = await prisma.media.findUnique({
      where: { shareToken: token },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!media || media.deletedAt) {
      return NextResponse.json({ error: 'Shared media not found' }, { status: 404 });
    }

    if (media.uploadStatus !== 'READY') {
      return NextResponse.json({ error: 'Media is still processing' }, { status: 202 });
    }

    // Check visibility permissions
    if (media.visibility === 'PRIVATE') {
      return NextResponse.json({ error: 'This media is private' }, { status: 403 });
    }

    if (media.visibility === 'WORKSPACE_ONLY') {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const isMember = media.workspace.members.some(m => m.userId === session.userId);
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!media.driveFileId) {
      return NextResponse.json({ error: 'Drive file ID is missing' }, { status: 500 });
    }

    // Resolve correct drive owner (workspace owner or uploader)
    const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);
    const accessToken = await getFreshAccessToken(targetUserId);

    // Stream the file from Google Drive
    const driveRes = await fetchFileStream(accessToken, media.driveFileId);

    // Return the stream directly
    return new NextResponse(driveRes.body, {
      headers: {
        'Content-Type': media.mimeType || (media.type === 'SCREENSHOT' ? 'image/png' : 'video/webm'),
        'Content-Length': media.fileSizeBytes?.toString() || '',
        'Cache-Control': 'public, max-age=86400', // cache public shares heavily
        'Content-Disposition': `inline; filename="${media.title}"`
      }
    });
  } catch (error: any) {
    console.error(`[share-file-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
