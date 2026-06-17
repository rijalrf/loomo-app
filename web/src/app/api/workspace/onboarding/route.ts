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
    const { name, description, department, members } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedDesc = description ? description.trim() : null;
    const trimmedDept = department ? department.trim() : null;

    // Create the workspace and set the owner in a transaction
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

    // Handle initial member invitations if any are provided (optional)
    if (Array.isArray(members) && members.length > 0) {
      for (const email of members) {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) continue;

        // Find if user exists
        let targetUser = await prisma.user.findUnique({
          where: { email: trimmedEmail }
        });

        if (!targetUser) {
          // Create a placeholder user so they can join automatically on Google login
          const tempGoogleId = `invited_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          targetUser = await prisma.user.create({
            data: {
              googleId: tempGoogleId,
              email: trimmedEmail,
              displayName: trimmedEmail.split('@')[0],
              avatarUrl: '',
              accessToken: '',
              refreshToken: ''
            }
          });
        }

        // Create membership
        await prisma.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: targetUser.id,
            role: 'MEMBER',
            acceptedAt: targetUser.googleId.startsWith('invited_') ? null : new Date()
          }
        });
      }
    }

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
    console.error(`[workspace-onboarding-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
