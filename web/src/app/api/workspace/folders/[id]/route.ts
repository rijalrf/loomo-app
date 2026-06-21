import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Find the folder and check its workspace
    const folder = await prisma.folder.findUnique({
      where: { id }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Verify user is OWNER of the workspace (members cannot rename folders)
    const isOwner = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: folder.workspaceId,
        userId: session.userId,
        role: 'OWNER'
      }
    });

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. Only workspace owners can rename projects.' }, { status: 403 });
    }

    // Check if name is already taken in this workspace by another folder
    const nameTaken = await prisma.folder.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: folder.workspaceId,
          name: trimmedName
        }
      }
    });

    if (nameTaken && nameTaken.id !== id) {
      return NextResponse.json({ error: 'Folder name already exists in this workspace' }, { status: 400 });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name: trimmedName }
    });

    return NextResponse.json({ success: true, folder: updatedFolder });
  } catch (error: any) {
    console.error(`[folder-patch-api] Error: ${error.message || String(error)}`);
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
    // Find the folder
    const folder = await prisma.folder.findUnique({
      where: { id }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Verify user is OWNER of the workspace (members cannot delete folders)
    const isOwner = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: folder.workspaceId,
        userId: session.userId,
        role: 'OWNER'
      }
    });

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. Only workspace owners can delete projects.' }, { status: 403 });
    }

    // Delete folder
    await prisma.folder.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[folder-delete-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
