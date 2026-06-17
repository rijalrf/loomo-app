import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, department } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedDesc = description ? description.trim() : null;
    const trimmedDept = department ? department.trim() : null;

    // Create the new workspace and the owner membership in a single transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const defaultSaveToOwner = process.env.DEFAULT_SAVE_TO_OWNER_DRIVE !== 'false';
      const newWorkspace = await tx.workspace.create({
        data: {
          name: trimmedName,
          description: trimmedDesc,
          department: trimmedDept,
          saveToOwnerDrive: defaultSaveToOwner,
          createdBy: session.userId
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: session.userId,
          role: 'OWNER',
          acceptedAt: new Date()
        }
      });

      return newWorkspace;
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: 'OWNER',
        isOwner: true
      }
    });
  } catch (error: any) {
    console.error(`[workspace-create-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, saveToOwnerDrive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify workspace existence and ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Forbidden. Only the workspace owner can change settings.' }, { status: 403 });
    }

    const data: any = {};
    if (typeof saveToOwnerDrive === 'boolean') {
      data.saveToOwnerDrive = saveToOwnerDrive;
    }

    // Update the workspace setting
    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        saveToOwnerDrive: updatedWorkspace.saveToOwnerDrive
      }
    });
  } catch (error: any) {
    console.error(`[workspace-patch-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
