import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    // Verify user is a member of the workspace
    const isMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.userId
      }
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const folders = await prisma.folder.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error(`[folders-get-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, workspaceId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Verify user is member of the workspace
    const isMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.userId
      }
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if folder name already exists in workspace
    const existingFolder = await prisma.folder.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: trimmedName
        }
      }
    });

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder name already exists in this workspace' }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name: trimmedName,
        workspaceId
      }
    });

    return NextResponse.json({ success: true, folder });
  } catch (error: any) {
    console.error(`[folders-post-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
