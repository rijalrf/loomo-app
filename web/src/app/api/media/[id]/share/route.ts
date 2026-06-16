import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import crypto from 'crypto';

export async function POST(
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

    // Check workspace membership
    const member = media.workspace.members.find(m => m.userId === session.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      media.uploadStatus !== 'READY' &&
      media.uploadStatus !== 'PROCESSING' &&
      media.uploadStatus !== 'UPLOADING'
    ) {
      return NextResponse.json({ error: 'Media is not ready for sharing yet' }, { status: 400 });
    }

    // Generate cryptographically random token
    // crypto.randomBytes(24) in base64url returns exactly 32 characters which are URL-safe
    const token = crypto.randomBytes(24).toString('base64url');

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        shareToken: token,
        // Automatically set visibility to UNLISTED if it was PRIVATE when shared, so it is viewable via link
        visibility: media.visibility === 'PRIVATE' ? 'UNLISTED' : media.visibility
      },
      select: {
        id: true,
        shareToken: true,
        visibility: true
      }
    });

    return NextResponse.json({
      success: true,
      shareToken: updatedMedia.shareToken,
      visibility: updatedMedia.visibility
    });
  } catch (error: any) {
    logger.error('media-share-api', `Error: ${error.message || String(error)}`);
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

    // Check workspace membership
    const member = media.workspace.members.find(m => m.userId === session.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow revoking if uploader or workspace owner
    const isUploader = media.uploadedBy === session.userId;
    const isOwner = member.role === 'OWNER';
    if (!isUploader && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to revoke share link' }, { status: 403 });
    }

    await prisma.media.update({
      where: { id },
      data: {
        shareToken: null,
        // Optional: revert to PRIVATE if it was UNLISTED when shared
        visibility: media.visibility === 'UNLISTED' ? 'PRIVATE' : media.visibility
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('media-share-api', `Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
