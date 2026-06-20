'use client';

import { useWorkspace } from '@/hooks/useWorkspace';
import AppLayout from './layout/AppLayout';
import SettingsContent from './settings/SettingsContent';
import CreateWorkspaceModal from './CreateWorkspaceModal';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface SettingsClientProps {
  initialUser: User;
  initialWorkspaces: Workspace[];
}

export default function SettingsClient({
  initialUser,
  initialWorkspaces
}: SettingsClientProps) {
  const {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    showCreateModal,
    setShowCreateModal
  } = useWorkspace(initialWorkspaces);

  const handleWorkspaceUpdate = (updatedWorkspace: Workspace) => {
    setWorkspaces(prev => 
      prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w)
    );
  };

  const breadcrumbs = [
    { label: 'All Captures', href: '/' },
    { label: 'Settings', active: true }
  ];

  return (
    <>
      <AppLayout
        user={initialUser}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onCreateWorkspaceClick={() => setShowCreateModal(true)}
        breadcrumbs={breadcrumbs}
        contentMaxWidth="6xl"
      >
        {activeWorkspace && (
          <SettingsContent
            user={initialUser}
            activeWorkspace={activeWorkspace}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceUpdate={handleWorkspaceUpdate}
          />
        )}
      </AppLayout>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newWs) => {
          setWorkspaces((prev) => [...prev, newWs]);
          setActiveWorkspaceId(newWs.id);
          setShowCreateModal(false);
        }}
      />
    </>
  );
}
