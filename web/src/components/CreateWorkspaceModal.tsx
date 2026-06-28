'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newWs: { id: string; name: string; role: string; isOwner: boolean }) => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated
}: CreateWorkspaceModalProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceDept, setNewWorkspaceDept] = useState('Engineering & Product');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  if (!isOpen) return null;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreatingWorkspace(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDesc,
          department: newWorkspaceDept
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newWs = data.workspace;
        onCreated({
          id: newWs.id,
          name: newWs.name,
          role: newWs.role || 'OWNER',
          isOwner: newWs.isOwner !== false
        });
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
        setNewWorkspaceDept('Engineering & Product');
        toast.success(`Workspace "${newWs.name}" berhasil dibuat!`);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Gagal membuat workspace');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleClose = () => {
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setNewWorkspaceDept('Engineering & Product');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)]/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md font-sans">
      <div className="glass-panel w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-white tracking-tight">Create Workspace</h3>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Workspace Name</label>
            <input
              type="text"
              placeholder="e.g. Marketing Team, Personal Projects..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full bg-[var(--bg-main)]/40 border border-[var(--border-color)] focus:border-[var(--primary)] text-sm py-2.5 px-3 rounded-lg outline-none text-white transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Short Description</label>
            <input
              type="text"
              placeholder="e.g. Collaborative space for marketing team (optional)..."
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              className="w-full bg-[var(--bg-main)]/40 border border-[var(--border-color)] focus:border-[var(--primary)] text-sm py-2.5 px-3 rounded-lg outline-none text-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Department / Team</label>
            <select
              value={newWorkspaceDept}
              onChange={(e) => setNewWorkspaceDept(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--primary)] text-sm py-2.5 px-3 rounded-lg outline-none text-white transition-all cursor-pointer font-medium"
            >
              <option value="Engineering & Product" className="bg-[var(--bg-card)] text-white">Engineering & Product</option>
              <option value="Design & Creative" className="bg-[var(--bg-card)] text-white">Design & Creative</option>
              <option value="Marketing & Sales" className="bg-[var(--bg-card)] text-white">Marketing & Sales</option>
              <option value="Operations & HR" className="bg-[var(--bg-card)] text-white">Operations & HR</option>
              <option value="Personal & Individual" className="bg-[var(--bg-card)] text-white">Personal & Individual</option>
              <option value="Other / Custom" className="bg-[var(--bg-card)] text-white">Other / Custom</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary py-2 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingWorkspace || !newWorkspaceName.trim()}
              className="btn-primary py-2 px-4 rounded-lg text-sm justify-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
