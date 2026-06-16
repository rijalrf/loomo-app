import { getSession } from '../lib/session';
import { prisma } from '../lib/db';
import LandingClient from '../components/LandingClient';
import DashboardClient from '../components/DashboardClient';
import SessionSync from '../components/SessionSync';
import PendingImportHandler from '../components/PendingImportHandler';
import CallbackRedirect from '../components/CallbackRedirect';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    code?: string;
    error?: string;
    driveFileId?: string;
    state?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const query = await searchParams;
  
  // 1. If code is present from Google, redirect via client component to Route Handler
  if (query.code) {
    return <CallbackRedirect code={query.code} state={query.state} />;
  }

  // 2. Normal rendering flow
  const session = await getSession();

  if (!session) {
    return (
      <>
        <SessionSync session={null} />
        <LandingClient />
      </>
    );
  }

  // Fetch workspaces for the logged-in user
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          workspace: true
        }
      }
    }
  });

  if (!dbUser) {
    return (
      <>
        <SessionSync session={null} />
        <LandingClient />
      </>
    );
  }

  const workspaces = dbUser.memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    role: membership.role,
    isOwner: membership.workspace.createdBy === dbUser.id
  }));

  const activeWorkspaceId = workspaces[0]?.id || '';
  let initialMedia: any[] = [];
  
  if (activeWorkspaceId) {
    initialMedia = await prisma.media.findMany({
      where: {
        workspaceId: activeWorkspaceId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        workspaceId: true,
        uploadedBy: true,
        title: true,
        type: true,
        driveThumbnailUrl: true,
        shareToken: true,
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
  }

  // Map Date objects to ISO strings for client compatibility
  const serializedMedia = initialMedia.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString()
  }));

  return (
    <>
      <SessionSync session={session} />
      <Suspense fallback={null}>
        <PendingImportHandler />
      </Suspense>
      <DashboardClient
        initialUser={{
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName,
          avatarUrl: dbUser.avatarUrl
        }}
        initialWorkspaces={workspaces}
        initialMedia={serializedMedia}
      />
    </>
  );
}
