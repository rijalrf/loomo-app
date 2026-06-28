import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { runSchedulerOnce } from '@/lib/scheduler';
import { getFreshAccessToken, getOrCreateDynamicFolder } from '@/lib/gdrive';
import { getDriveOwnerId } from '@/lib/workspace';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        title,
        description,
        type: typeStr,
        workspaceId,
        folderId,
        durationSeconds = 0,
        width,
        height,
        fileSize,
      } = body;

      if (!typeStr || (typeStr !== 'screenshot' && typeStr !== 'recording')) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }

      if (!fileSize || typeof fileSize !== 'number') {
        return NextResponse.json({ error: 'Invalid or missing fileSize' }, { status: 400 });
      }

      const type = typeStr === 'screenshot' ? 'SCREENSHOT' : 'RECORDING';
      const mimeType = type === 'SCREENSHOT' ? 'image/png' : 'video/webm';

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

      const workspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
      });
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      // 2. Resolve folderId if provided
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

      let folder: any = null;
      if (verifiedFolderId) {
        folder = await prisma.folder.findUnique({
          where: { id: verifiedFolderId }
        });
      }

      const mediaTitle = title || (type === 'SCREENSHOT' ? `Screenshot ${new Date().toLocaleDateString()}` : `Recording ${new Date().toLocaleDateString()}`);

      // Create Media record with status UPLOADING
      const media = await prisma.media.create({
        data: {
          workspaceId: targetWorkspaceId!,
          folderId: verifiedFolderId,
          uploadedBy: session.userId,
          title: mediaTitle,
          description: description || null,
          type,
          mimeType,
          visibility: 'PRIVATE',
          uploadStatus: 'UPLOADING',
          durationSeconds,
          width,
          height
        }
      });

      // Get Google token
      const targetUserId = getDriveOwnerId(workspace, session.userId);
      const accessToken = await getFreshAccessToken(targetUserId);

      // Create folder path
      const pathParts = ["Loomo"];
      if (workspace?.name) {
        pathParts.push(workspace.name);
      }
      if (folder?.name) {
        pathParts.push(folder.name);
      }
      pathParts.push(type === "SCREENSHOT" ? "Screenshots" : "Recordings");

      const targetFolderId = await getOrCreateDynamicFolder(accessToken, pathParts);

      // Filename
      const cleanWorkspaceName = (workspace?.name || "Workspace").replace(/[^a-zA-Z0-9]+/g, "_");
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateVal = new Date(media.createdAt);
      const tgltime = `${dateVal.getFullYear()}${pad(dateVal.getMonth() + 1)}${pad(dateVal.getDate())}_${pad(dateVal.getHours())}${pad(dateVal.getMinutes())}${pad(dateVal.getSeconds())}`;
      const shortId = media.id.substring(0, 8);
      const fileExt = type === "SCREENSHOT" ? "png" : "webm";
      const driveFilename = `${cleanWorkspaceName}_${tgltime}_${shortId}_loomo.${fileExt}`;

      // Initiate Resumable Upload on Google Drive
      const clientOrigin = request.headers.get('origin') || '';
      const gDriveInitiateRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': fileSize.toString(),
          'X-Upload-Content-Type': mimeType,
          Origin: clientOrigin
        },
        body: JSON.stringify({
          name: driveFilename,
          parents: [targetFolderId]
        })
      });

      if (!gDriveInitiateRes.ok) {
        const errText = await gDriveInitiateRes.text();
        throw new Error(`Failed to initiate Google Drive resumable upload: ${gDriveInitiateRes.statusText} - ${errText}`);
      }

      const sessionUrl = gDriveInitiateRes.headers.get('location');
      if (!sessionUrl) {
        throw new Error('No upload location header returned from Google Drive API');
      }

      return NextResponse.json({
        success: true,
        mediaId: media.id,
        uploadUrl: sessionUrl
      });
    }

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
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (fileBuffer.length > maxSizeBytes) {
      return NextResponse.json({ error: 'File size exceeds 100 MB limit' }, { status: 400 });
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

    const base64Data = fileBuffer.toString('base64');

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
      const fileName = `${media.id}.${fileExt}`;

      const job = await tx.backgroundJob.create({
        data: {
          mediaId: media.id,
          userId: session.userId,
          jobType: 'UPLOAD',
          status: 'QUEUED',
          fileData: base64Data,
          fileName: fileName,
          fileMimeType: mimeType,
          maxAttempts: 5
        }
      });

      return { media, job };
    }, {
      timeout: 60000 // 60 seconds timeout for large uploads
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
