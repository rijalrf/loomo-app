import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
        return NextResponse.json({ error: 'Authentication required to view workspace media' }, { status: 401 });
      }

      const isMember = media.workspace.members.some(m => m.userId === session.userId);
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Public details (do not return drive_file_id)
    return NextResponse.json({
      title: media.title,
      type: media.type,
      durationSeconds: media.durationSeconds,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt,
      visibility: media.visibility,
      uploader: media.uploader
    });
  } catch (error: any) {
    console.error(`[share-details-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
