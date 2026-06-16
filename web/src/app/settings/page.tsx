import { getSession } from '../../lib/session';
import { prisma } from '../../lib/db';
import { redirect } from 'next/navigation';
import SettingsClient from '../../components/SettingsClient';
import SessionSync from '../../components/SessionSync';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
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
    redirect('/');
  }

  const workspaces = dbUser.memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    role: membership.role,
    isOwner: membership.workspace.createdBy === dbUser.id
  }));

  if (workspaces.length === 0) {
    redirect('/');
  }

  return (
    <>
      <SessionSync session={session} />
      <SettingsClient
        initialUser={{
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName,
          avatarUrl: dbUser.avatarUrl
        }}
        initialWorkspaces={workspaces}
      />
    </>
  );
}
