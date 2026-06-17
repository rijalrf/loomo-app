import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params; // WorkspaceMember record ID

  try {
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Membership record not found' }, { status: 404 });
    }

    const workspace = memberToRemove.workspace;

    // Check if the current user is authorized to perform removal:
    // 1. Current user is the owner of the workspace.
    // 2. Or, the user is removing themselves (leaving).
    const currentUserMember = workspace.members.find(m => m.userId === session.userId);
    if (!currentUserMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isOwner = currentUserMember.role === 'OWNER';
    const isRemovingSelf = memberToRemove.userId === session.userId;

    if (!isOwner && !isRemovingSelf) {
      return NextResponse.json({ error: 'Unauthorized to remove member' }, { status: 403 });
    }

    // Prevent removing the workspace owner creator if it leaves the workspace with no owner
    if (memberToRemove.role === 'OWNER') {
      const otherOwners = workspace.members.filter(m => m.role === 'OWNER' && m.id !== memberToRemove.id);
      if (otherOwners.length === 0) {
        return NextResponse.json({ error: 'Cannot remove the last owner of the workspace' }, { status: 400 });
      }
    }

    // Delete membership
    await prisma.workspaceMember.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[workspace-members-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
