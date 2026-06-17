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
  const typeParam = searchParams.get('type'); // "screenshot" | "recording"
  const statusParam = searchParams.get('status'); // "ready" | "processing" etc
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    // 1. Resolve workspaces that the user has access to
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: session.userId }
        }
      },
      select: { id: true }
    });

    const allowedWorkspaceIds = workspaces.map(w => w.id);

    if (allowedWorkspaceIds.length === 0) {
      return NextResponse.json({ media: [], total: 0, page, limit });
    }

    // Determine target workspace id filter
    let workspaceFilter = allowedWorkspaceIds;
    if (workspaceId) {
      if (!allowedWorkspaceIds.includes(workspaceId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      workspaceFilter = [workspaceId];
    }

    // Build filter query
    const where: any = {
      workspaceId: { in: workspaceFilter },
      deletedAt: null
    };

    if (typeParam) {
      where.type = typeParam.toUpperCase() === 'SCREENSHOT' ? 'SCREENSHOT' : 'RECORDING';
    }

    if (statusParam) {
      where.uploadStatus = statusParam.toUpperCase();
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get total count
    const total = await prisma.media.count({ where });

    // Fetch media records
    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        workspaceId: true,
        uploadedBy: true,
        title: true,
        type: true,
        driveThumbnailUrl: true,
        fileSizeBytes: true,
        mimeType: true,
        visibility: true,
        uploadStatus: true,
        durationSeconds: true,
        width: true,
        height: true,
        createdAt: true,
        uploader: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      media,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error(`[media-list-api] Error: ${error.message || String(error)}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
