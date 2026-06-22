import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { runSchedulerOnce } from '@/lib/scheduler';

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
        },
        uploader: {
          select: {
            displayName: true,
            avatarUrl: true,
            email: true
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

    return NextResponse.json(media);
  } catch (error: any) {
    console.error(`[media-get-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const member = media.workspace.members.find(m => m.userId === session.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow editing if they are owner or uploader
    const isUploader = media.uploadedBy === session.userId;
    const isOwner = member.role === 'OWNER';
    if (!isUploader && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to edit media' }, { status: 403 });
    }

    const body = await request.json();
    const { title, visibility, folderId, description } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (visibility !== undefined) {
      // Validate visibility enum
      if (['PRIVATE', 'UNLISTED', 'WORKSPACE_ONLY'].includes(visibility)) {
        data.visibility = visibility;
      } else {
        return NextResponse.json({ error: 'Invalid visibility level' }, { status: 400 });
      }
    }

    if (folderId !== undefined) {
      if (folderId === null || folderId === 'null' || folderId === 'none') {
        data.folderId = null;
      } else {
        // Validate folder belongs to this workspace
        const folderExists = await prisma.folder.findFirst({
          where: {
            id: folderId,
            workspaceId: media.workspaceId
          }
        });
        if (!folderExists) {
          return NextResponse.json({ error: 'Folder not found in this workspace' }, { status: 400 });
        }
        data.folderId = folderId;
      }
    }

    if (description !== undefined) {
      data.description = description || null;
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        folderId: true,
        uploadStatus: true
      }
    });

    return NextResponse.json(updatedMedia);
  } catch (error: any) {
    console.error(`[media-patch-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const member = media.workspace.members.find(m => m.userId === session.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow delete if uploader or workspace owner
    const isUploader = media.uploadedBy === session.userId;
    const isOwner = member.role === 'OWNER';
    if (!isUploader && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to delete media' }, { status: 403 });
    }

    // Mark status as DELETING
    await prisma.$transaction(async (tx) => {
      // 1. Update status to DELETING
      await tx.media.update({
        where: { id },
        data: { uploadStatus: 'DELETING' }
      });

      // 2. Create BackgroundJob for deletion
      await tx.backgroundJob.create({
        data: {
          mediaId: media.id,
          userId: session.userId,
          jobType: 'DELETE',
          status: 'QUEUED',
          maxAttempts: 5
        }
      });
    });

    // 3. Trigger scheduler (non-blocking, post-response)
    after(() => {
      runSchedulerOnce().catch(err => {
        console.error(`[delete-api] Error running scheduler in background: ${err.message || String(err)}`);
      });
    });

    return NextResponse.json({ success: true, status: 'DELETING' });
  } catch (error: any) {
    console.error(`[delete-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
