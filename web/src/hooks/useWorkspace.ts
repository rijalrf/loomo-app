import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface UseWorkspaceReturn {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  activeWorkspace: Workspace | undefined;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export function useWorkspace(
  initialWorkspaces: Workspace[],
  initialActiveId?: string
): UseWorkspaceReturn {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    initialActiveId || initialWorkspaces[0]?.id || ''
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('loomo_active_workspace_id');
    if (saved && workspaces.some(w => w.id === saved)) {
      setActiveWorkspaceId(saved);
    }
  }, [workspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('loomo_active_workspace_id', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    showCreateModal,
    setShowCreateModal
  };
}
