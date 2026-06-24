import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getFreshAccessToken, getFileMetadata } from '@/lib/gdrive';
import { getDriveOwnerId } from '@/lib/workspace';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mediaId, driveFileId, fileSize } = await request.json();

    if (!mediaId || !driveFileId) {
      return NextResponse.json({ error: 'mediaId and driveFileId are required' }, { status: 400 });
    }

    // 1. Fetch media and workspace to identify the Drive owner
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { workspace: true }
    });

    if (!media) {
      return NextResponse.json({ error: 'Media record not found' }, { status: 404 });
    }

    // 2. Fetch metadata from Google Drive to verify and retrieve thumbnail Link
    const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);
    const accessToken = await getFreshAccessToken(targetUserId);

    let thumbnailLink = null;
    let verifiedSize = fileSize;

    try {
      const gMetadata = await getFileMetadata(accessToken, driveFileId);
      thumbnailLink = gMetadata.thumbnailLink || null;
      if (gMetadata.size) {
        verifiedSize = parseInt(gMetadata.size, 10);
      }
    } catch (gErr: any) {
      console.warn(`[upload-complete] Could not fetch Google Drive metadata for file ${driveFileId}:`, gErr.message || gErr);
    }

    // 3. Update Media status to READY
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        driveFileId,
        driveThumbnailUrl: thumbnailLink,
        uploadStatus: 'READY',
        fileSizeBytes: verifiedSize ? parseInt(String(verifiedSize), 10) : null
      }
    });

    return NextResponse.json({
      success: true,
      mediaId: updatedMedia.id,
      status: 'READY'
    });

  } catch (error: any) {
    console.error(`[upload-complete] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
