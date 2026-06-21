'use client';

import { useState } from 'react';
import InviteForm from '../workspace/InviteForm';
import MembersList from '../workspace/MembersList';
import StorageSettings from './StorageSettings';

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

interface SettingsContentProps {
  user: User;
  activeWorkspace: Workspace;
  activeWorkspaceId: string;
  onWorkspaceUpdate: (workspace: Workspace) => void;
}

export default function SettingsContent({
  user,
  activeWorkspace,
  activeWorkspaceId,
  onWorkspaceUpdate
}: SettingsContentProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-5">
        <h2 className="text-3xl font-black text-white tracking-tight mb-1">
          Workspace Settings
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Manage members and invitations for <span className="text-[var(--primary)]">{activeWorkspace?.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <InviteForm
            activeWorkspaceId={activeWorkspaceId}
            isOwner={activeWorkspace?.isOwner || false}
            onInviteSuccess={() => setRefreshKey(k => k + 1)}
          />

          <MembersList
            key={refreshKey}
            activeWorkspaceId={activeWorkspaceId}
            currentUserId={user.id}
            isOwner={activeWorkspace?.isOwner || false}
          />
        </div>

        <div className="space-y-6">
          <StorageSettings
            activeWorkspace={activeWorkspace}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceUpdate={onWorkspaceUpdate}
          />
        </div>
      </div>
    </div>
  );
}
