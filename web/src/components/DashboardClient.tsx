'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import AppLayout from './layout/AppLayout';
import DashboardContent from './dashboard/DashboardContent';
import OnboardingJourney from './OnboardingJourney';
import CreateWorkspaceModal from './CreateWorkspaceModal';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface Media {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  uploadedBy: string;
  title: string;
  description?: string | null;
  type: 'SCREENSHOT' | 'RECORDING';
  driveThumbnailUrl: string | null;
  shareToken: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  uploadStatus: 'PROCESSING' | 'UPLOADING' | 'READY' | 'FAILED' | 'DELETING';
  durationSeconds: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploader: {
    displayName: string;
    avatarUrl: string | null;
  };
}

interface DashboardClientProps {
  initialUser: User;
  initialWorkspaces: Workspace[];
  initialMedia: Media[];
}

export default function DashboardClient({
  initialUser,
  initialWorkspaces,
  initialMedia
}: DashboardClientProps) {
  const {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    showCreateModal,
    setShowCreateModal
  } = useWorkspace(initialWorkspaces);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Load folder selection from localStorage on mount
  useEffect(() => {
    const savedFolder = localStorage.getItem('loomo_active_folder_id');
    if (savedFolder) {
      setActiveFolderId(savedFolder);
    }
  }, []);

  useEffect(() => {
    setActiveFolderId(null);
    localStorage.removeItem('loomo_active_folder_id');
  }, [activeWorkspaceId]);

  const handleSetActiveFolderId = (id: string | null) => {
    setActiveFolderId(id);
    if (id) {
      localStorage.setItem('loomo_active_folder_id', id);
    } else {
      localStorage.removeItem('loomo_active_folder_id');
    }
  };

  if (workspaces.length === 0) {
    return (
      <OnboardingJourney
        user={initialUser}
        onComplete={(newWorkspace) => {
          setWorkspaces([newWorkspace]);
          setActiveWorkspaceId(newWorkspace.id);
        }}
      />
    );
  }

  const breadcrumbs = [
    { label: 'Workspace' },
    { label: 'All Captures', active: true }
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
        contentMaxWidth="full"
        activeFolderId={activeFolderId}
        setActiveFolderId={handleSetActiveFolderId}
      >
        <DashboardContent
          activeWorkspaceId={activeWorkspaceId}
          activeWorkspaceName={activeWorkspace?.name || ''}
          initialMedia={initialMedia}
          activeFolderId={activeFolderId}
        />
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
