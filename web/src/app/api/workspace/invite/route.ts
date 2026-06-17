import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, role, workspaceId } = body;

    if (!email || !workspaceId) {
      return NextResponse.json({ error: 'Email and workspaceId are required' }, { status: 400 });
    }

    // 1. Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentUserMember = workspace.members.find(m => m.userId === session.userId);
    if (!currentUserMember || currentUserMember.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only workspace owners can invite members' }, { status: 403 });
    }

    // 2. Enforce workspace size limit (FR-WEB-005: Max 50 members)
    if (workspace.members.length >= 50) {
      return NextResponse.json({ error: 'Workspace has reached the maximum limit of 50 members' }, { status: 400 });
    }

    // 3. Find if user exists
    let targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      // Create a placeholder user so they can join automatically on Google login
      // Google ID is set to a temporary value, which we will update upon OAuth callback
      const tempGoogleId = `invited_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      targetUser = await prisma.user.create({
        data: {
          googleId: tempGoogleId,
          email,
          displayName: email.split('@')[0],
          avatarUrl: '',
          accessToken: '', // will be set on login
          refreshToken: ''
        }
      });
    }

    // 4. Check if already a member
    const isAlreadyMember = workspace.members.some(m => m.userId === targetUser!.id);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
    }

    // 5. Create membership
    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: role === 'OWNER' ? 'OWNER' : 'MEMBER',
        acceptedAt: targetUser.googleId.startsWith('invited_') ? null : new Date() // accepted if they already have an account
      }
    });

    return NextResponse.json({
      success: true,
      member: {
        id: membership.id,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: membership.role,
        accepted: membership.acceptedAt !== null
      }
    });
  } catch (error: any) {
    console.error(`[workspace-invite-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
