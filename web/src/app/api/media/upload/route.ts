import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { runSchedulerOnce } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const typeStr = formData.get('type') as string | null; // "screenshot" or "recording"
    const workspaceId = formData.get('workspaceId') as string | null;
    const folderId = formData.get('folderId') as string | null;
    const durationSeconds = parseInt(formData.get('durationSeconds') as string || '0', 10);
    const width = formData.get('width') as string ? parseInt(formData.get('width') as string, 10) : null;
    const height = formData.get('height') as string ? parseInt(formData.get('height') as string, 10) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!typeStr || (typeStr !== 'screenshot' && typeStr !== 'recording')) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const type = typeStr === 'screenshot' ? 'SCREENSHOT' : 'RECORDING';
    const mimeType = file.type || (type === 'SCREENSHOT' ? 'image/png' : 'video/webm');

    // 1. Resolve workspaceId (use first workspace if not provided)
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const defaultWorkspace = await prisma.workspace.findFirst({
        where: {
          members: {
            some: { userId: session.userId }
          }
        }
      });
      
      if (!defaultWorkspace) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
      }
      targetWorkspaceId = defaultWorkspace.id;
    }

    // 2. Read arrayBuffer and convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Validate file limits
    const maxSizeBytes = 500 * 1024 * 1024; // 500 MB
    if (fileBuffer.length > maxSizeBytes) {
      return NextResponse.json({ error: 'File size exceeds 500 MB limit' }, { status: 400 });
    }

    // 3. Create Media and BackgroundJob records inside transaction
    // Validate folderId if provided
    let verifiedFolderId: string | null = null;
    if (folderId && folderId !== 'null' && folderId !== 'none') {
      const folderExists = await prisma.folder.findFirst({
        where: {
          id: folderId,
          workspaceId: targetWorkspaceId!
        }
      });
      if (folderExists) {
        verifiedFolderId = folderId;
      }
    }

    const mediaTitle = title || (type === 'SCREENSHOT' ? `Screenshot ${new Date().toLocaleDateString()}` : `Recording ${new Date().toLocaleDateString()}`);

    const result = await prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          workspaceId: targetWorkspaceId!,
          folderId: verifiedFolderId,
          uploadedBy: session.userId,
          title: mediaTitle,
          description: description || null,
          type,
          mimeType,
          visibility: 'PRIVATE',
          uploadStatus: 'PROCESSING',
          durationSeconds,
          width,
          height
        }
      });

      const fileExt = type === 'SCREENSHOT' ? 'png' : 'webm';
      const tempFilePath = path.join(os.tmpdir(), `${media.id}.${fileExt}`);

      // Save file to temp path
      await fs.writeFile(tempFilePath, fileBuffer);

      const job = await tx.backgroundJob.create({
        data: {
          mediaId: media.id,
          userId: session.userId,
          jobType: 'UPLOAD',
          status: 'QUEUED',
          tempFilePath,
          maxAttempts: 5
        }
      });

      return { media, job };
    });

    // 4. Trigger the scheduler in the background (non-blocking, post-response)
    after(() => {
      runSchedulerOnce().catch(err => {
        console.error(`[upload-api] Error running scheduler in background: ${err.message || String(err)}`);
      });
    });

    return NextResponse.json({
      success: true,
      mediaId: result.media.id,
      status: 'PROCESSING'
    });
  } catch (error: any) {
    console.error(`[upload-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
