import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { runSchedulerOnce } from '@/lib/scheduler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media || media.uploadedBy !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.media.update({
      where: { id },
      data: { uploadStatus: 'PROCESSING' }
    });

    await prisma.backgroundJob.updateMany({
      where: { mediaId: id },
      data: { 
        status: 'QUEUED', 
        attempts: 0
      }
    });

    after(() => {
      runSchedulerOnce().catch(err => {
        console.error(`[retry-api] Error running scheduler in background: ${err.message || String(err)}`);
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
