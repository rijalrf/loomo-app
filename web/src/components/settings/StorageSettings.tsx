'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/clientLogger';

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface StorageSettingsProps {
  activeWorkspace: Workspace;
  activeWorkspaceId: string;
  onWorkspaceUpdate: (workspace: Workspace) => void;
}

export default function StorageSettings({
  activeWorkspace,
  activeWorkspaceId,
  onWorkspaceUpdate
}: StorageSettingsProps) {
  const [updatingStorage, setUpdatingStorage] = useState(false);

  const handleUpdateStorageSetting = async (saveToOwnerDrive: boolean) => {
    if (!activeWorkspaceId) return;
    setUpdatingStorage(true);
    
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeWorkspaceId,
          saveToOwnerDrive
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('Storage settings updated successfully!');
        onWorkspaceUpdate({ ...activeWorkspace, saveToOwnerDrive: data.workspace.saveToOwnerDrive });
      } else {
        toast.error(data.error || 'Failed to update storage settings');
      }
    } catch (e) {
      clientLogger.error('settings-content', 'Failed to update workspace storage settings:', e);
      toast.error('Network error. Failed to update storage settings.');
    } finally {
      setUpdatingStorage(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg">
      <h3 className="text-base font-black text-white tracking-tight mb-4">Storage Settings</h3>
      
      <div className="space-y-4">
        <div className="text-xs text-slate-400 leading-relaxed">
          Choose where captures from this workspace should be saved in Google Drive.
        </div>

        <div className="space-y-3">
          <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
            activeWorkspace?.saveToOwnerDrive === false
              ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
              : 'bg-[var(--bg-main)]/40 border border-[var(--border-color)] hover:border-[var(--primary)]/30'
          }`}>
            <input
              type="radio"
              name="storage"
              checked={activeWorkspace?.saveToOwnerDrive === false}
              onChange={() => handleUpdateStorageSetting(false)}
              disabled={updatingStorage || !activeWorkspace?.isOwner}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-white mb-1">User&apos;s Own Drive</div>
              <div className="text-xs text-slate-500">Each member saves to their personal Google Drive</div>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
            activeWorkspace?.saveToOwnerDrive === true
              ? 'bg-[var(--primary)]/10 border-2 border-[var(--primary)]'
              : 'bg-[var(--bg-main)]/40 border border-[var(--border-color)] hover:border-[var(--primary)]/30'
          }`}>
            <input
              type="radio"
              name="storage"
              checked={activeWorkspace?.saveToOwnerDrive === true}
              onChange={() => handleUpdateStorageSetting(true)}
              disabled={updatingStorage || !activeWorkspace?.isOwner}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-white mb-1">Workspace Owner&apos;s Drive</div>
              <div className="text-xs text-slate-500">All captures save to owner&apos;s Google Drive</div>
            </div>
          </label>
        </div>

        {!activeWorkspace?.isOwner && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            Only workspace owners can change storage settings.
          </div>
        )}
      </div>
    </div>
  );
}
