'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Folder, Settings, BookOpen, ChevronDown, Check, Plus, LogOut, Edit2, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSwitcherDropdown from './ThemeSwitcherDropdown';
import PopupModal from './PopupModal';
import { showLoadingAlert, hideLoadingAlert } from './LoadingAlert';

interface SidebarProps {
  initialUser: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
    isOwner: boolean;
  }>;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  onCreateWorkspaceClick: () => void;
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
}

export default function Sidebar({
  initialUser,
  workspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  onCreateWorkspaceClick,
  activeFolderId,
  setActiveFolderId
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Folders State
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingFolderName, setDeletingFolderName] = useState('');
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceDesc, setEditWorkspaceDesc] = useState('');
  const [editWorkspaceDept, setEditWorkspaceDept] = useState('');
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);

  const fetchFolders = async () => {
    if (!activeWorkspaceId) return;
    setIsFoldersLoading(true);
    try {
      const res = await fetch(`/api/workspace/folders?workspaceId=${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    } finally {
      setIsFoldersLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [activeWorkspaceId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !activeWorkspaceId) return;
    setIsCreatingFolder(true);
    const loadingId = showLoadingAlert('Creating folder...');
    try {
      const res = await fetch('/api/workspace/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, workspaceId: activeWorkspaceId })
      });
      if (res.ok) {
        hideLoadingAlert(loadingId);
        toast.success('Folder created successfully');
        setNewFolderName('');
        setShowCreateFolderModal(false);
        fetchFolders();
      } else {
        const data = await res.json();
        hideLoadingAlert(loadingId);
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (err) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to connect to server');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleStartRenameFolder = (id: string, name: string) => {
    setRenamingFolderId(id);
    setRenamingFolderName(name);
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolderName.trim() || !renamingFolderId) return;
    setIsRenamingFolder(true);
    const loadingId = showLoadingAlert('Renaming folder...');
    try {
      const res = await fetch(`/api/workspace/folders/${renamingFolderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renamingFolderName })
      });
      if (res.ok) {
        hideLoadingAlert(loadingId);
        toast.success('Folder renamed successfully');
        setRenamingFolderId(null);
        setRenamingFolderName('');
        fetchFolders();
      } else {
        const data = await res.json();
        hideLoadingAlert(loadingId);
        toast.error(data.error || 'Failed to rename folder');
      }
    } catch (err) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to connect to server');
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleStartDeleteFolder = (id: string, name: string) => {
    setDeletingFolderId(id);
    setDeletingFolderName(name);
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolderId) return;
    setIsDeletingFolder(true);
    const loadingId = showLoadingAlert('Deleting folder...');
    try {
      const res = await fetch(`/api/workspace/folders/${deletingFolderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        hideLoadingAlert(loadingId);
        toast.success('Folder deleted successfully');
        if (activeFolderId === deletingFolderId) {
          setActiveFolderId(null);
        }
        setDeletingFolderId(null);
        setDeletingFolderName('');
        fetchFolders();
      } else {
        const data = await res.json();
        hideLoadingAlert(loadingId);
        toast.error(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to connect to server');
    } finally {
      setIsDeletingFolder(false);
    }
  };
  
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleLogout = async () => {
    const loadingId = showLoadingAlert('Logging out...');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      } else {
        hideLoadingAlert(loadingId);
        toast.error('Gagal keluar dari sesi');
      }
    } catch (err) {
      hideLoadingAlert(loadingId);
      toast.error('Terjadi kesalahan koneksi');
    }
  };

  const handleOpenEditWorkspace = async () => {
    if (!activeWorkspace) return;
    
    try {
      const res = await fetch(`/api/workspace/${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setEditWorkspaceName(data.workspace.name || '');
        setEditWorkspaceDesc(data.workspace.description || '');
        setEditWorkspaceDept(data.workspace.department || 'Engineering & Product');
        setShowEditWorkspaceModal(true);
      } else {
        toast.error('Failed to load workspace data');
      }
    } catch (err) {
      toast.error('Failed to connect to server');
    }
  };

  const handleEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkspaceName.trim() || !activeWorkspaceId) return;
    setIsEditingWorkspace(true);
    const loadingId = showLoadingAlert('Updating workspace...');
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeWorkspaceId,
          name: editWorkspaceName,
          description: editWorkspaceDesc,
          department: editWorkspaceDept
        })
      });
      if (res.ok) {
        hideLoadingAlert(loadingId);
        toast.success('Workspace updated successfully');
        setShowEditWorkspaceModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        hideLoadingAlert(loadingId);
        toast.error(data.error || 'Failed to update workspace');
      }
    } catch (err) {
      hideLoadingAlert(loadingId);
      toast.error('Failed to connect to server');
    } finally {
      setIsEditingWorkspace(false);
    }
  };

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 font-sans">
      <div className="flex flex-col gap-3.5 p-3.5">
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-white py-2.5 px-3 rounded-lg outline-none transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-black text-base shrink-0">
                {activeWorkspace?.name?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Workspace</span>
                <span className="text-sm text-white group-hover:text-[var(--primary)] transition-colors truncate">
                  {activeWorkspace?.name}
                </span>
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${workspaceDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
                <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-wider px-2.5 py-1.5">Select Workspace</label>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorkspaceId(w.id);
                      setWorkspaceDropdownOpen(false);
                      if (pathname !== '/') {
                        router.push('/');
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
                      w.id === activeWorkspaceId
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${w.id === activeWorkspaceId ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`} />
                    <span className="truncate flex-1">{w.name} {w.isOwner ? '(Owner)' : ''}</span>
                    {w.id === activeWorkspaceId && <Check size={14} className="text-[var(--primary)] shrink-0" />}
                  </button>
                ))}
                {activeWorkspace && (activeWorkspace.isOwner || activeWorkspace.role === 'OWNER') && (
                  <>
                    <div className="h-px bg-[var(--border-color)] my-1"></div>
                    <button
                      onClick={() => {
                        handleOpenEditWorkspace();
                        setWorkspaceDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil size={16} />
                      <span>Edit Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateWorkspaceClick();
                        setWorkspaceDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Create Workspace</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-2.5">Main Menu</label>
            
            <button
              onClick={() => {
                setActiveFolderId(null);
                if (pathname !== '/') {
                  router.push('/');
                }
              }}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-left ${
                pathname === '/' && activeFolderId === null
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Folder size={16} />
              <span>All Captures</span>
            </button>
          </div>

          {/* Folders List */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Projects</label>
              {activeWorkspace && (activeWorkspace.isOwner || activeWorkspace.role === 'OWNER') && (
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer p-0.5"
                  title="Create Project"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => {
                  setActiveFolderId('none');
                  if (pathname !== '/') {
                    router.push('/');
                  }
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer text-left ${
                  activeFolderId === 'none'
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Folder size={14} className="opacity-50" />
                <span className="truncate flex-1">Unassigned</span>
              </button>

              {folders.map((folder) => (
                <div key={folder.id} className="group flex items-center justify-between rounded-lg hover:bg-[var(--bg-hover)] transition-colors pr-1.5">
                  <button
                    onClick={() => {
                      setActiveFolderId(folder.id);
                      if (pathname !== '/') {
                        router.push('/');
                      }
                    }}
                    className={`flex-1 flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer text-left truncate ${
                      activeFolderId === folder.id
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <Folder size={14} className="shrink-0" />
                    <span className="truncate flex-1">{folder.name}</span>
                  </button>
                  
                  {activeWorkspace && (activeWorkspace.isOwner || activeWorkspace.role === 'OWNER') && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                      <button
                        onClick={() => handleStartRenameFolder(folder.id, folder.name)}
                        className="text-[var(--text-muted)] hover:text-[var(--primary)] p-0.5 cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleStartDeleteFolder(folder.id, folder.name)}
                        className="text-[var(--text-muted)] hover:text-red-400 p-0.5 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {folders.length === 0 && !isFoldersLoading && (
                <div className="text-xs text-[var(--text-muted)] italic px-2.5 py-1.5">No projects created</div>
              )}
              {isFoldersLoading && (
                <div className="text-xs text-[var(--text-muted)] italic px-2.5 py-1.5">Loading...</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-2.5">System</label>
            
            <button
              onClick={() => {
                if (pathname !== '/settings') {
                  router.push('/settings');
                }
              }}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer text-left ${
                pathname === '/settings'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Documentation</span>
            </a>
          </div>
        </nav>
      </div>

      <div className="border-t border-[var(--border-color)] relative" ref={userDropdownRef}>
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="w-full flex items-center justify-between gap-3 p-3 hover:bg-[var(--bg-hover)] transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                {initialUser.displayName[0]}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{initialUser.displayName}</span>
              <span className="text-[10px] font-medium text-[var(--text-muted)] truncate leading-none mt-1">
                {(() => {
                  const rawRole = workspaces.find(w => w.id === activeWorkspaceId)?.role || 'Member';
                  return rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
                })()}
              </span>
            </div>
          </div>
          <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
        </button>

        {userDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
            <div className="px-2.5 py-1.5 border-b border-[var(--border-color)] mb-1">
              <div className="text-xs font-bold text-[var(--text-muted)] truncate">{initialUser.email}</div>
            </div>
            
            <div className="mb-1">
              <ThemeSwitcherDropdown />
            </div>
            
            <div className="h-px bg-[var(--border-color)] my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-full py-2 px-2.5 text-left hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-bold text-[var(--text-muted)] rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <PopupModal
        isOpen={showCreateFolderModal}
        onClose={() => {
          setShowCreateFolderModal(false);
          setNewFolderName('');
        }}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Create New Project</h3>
        <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed font-sans">
          Create a new project to organize your screenshots and recordings.
        </p>
        <form onSubmit={handleCreateFolder} className="space-y-4 font-sans">
          <input
            type="text"
            placeholder="Project name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            disabled={isCreatingFolder}
            autoFocus
            className="w-full bg-[#0a0a0b] border border-[#3f3f46] text-white py-2 px-3 rounded-lg text-sm outline-none focus:border-[var(--primary)] transition-colors"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCreateFolderModal(false);
                setNewFolderName('');
              }}
              disabled={isCreatingFolder}
              className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingFolder || !newFolderName.trim()}
              className="px-4 py-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingFolder ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </PopupModal>

      {/* Rename Folder Modal */}
      <PopupModal
        isOpen={renamingFolderId !== null}
        onClose={() => {
          setRenamingFolderId(null);
          setRenamingFolderName('');
        }}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Rename Project</h3>
        <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed font-sans">
          Enter a new name for this project.
        </p>
        <form onSubmit={handleRenameFolder} className="space-y-4 font-sans">
          <input
            type="text"
            placeholder="Project name"
            value={renamingFolderName}
            onChange={(e) => setRenamingFolderName(e.target.value)}
            disabled={isRenamingFolder}
            autoFocus
            className="w-full bg-[#0a0a0b] border border-[#3f3f46] text-white py-2 px-3 rounded-lg text-sm outline-none focus:border-[var(--primary)] transition-colors"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setRenamingFolderId(null);
                setRenamingFolderName('');
              }}
              disabled={isRenamingFolder}
              className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenamingFolder || !renamingFolderName.trim()}
              className="px-4 py-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRenamingFolder ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </PopupModal>

      {/* Delete Folder Modal */}
      <PopupModal
        isOpen={deletingFolderId !== null}
        onClose={() => {
          setDeletingFolderId(null);
          setDeletingFolderName('');
        }}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Delete Project</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed font-sans">
          Are you sure you want to delete the project <span className="text-white font-bold">"{deletingFolderName}"</span>? 
          Any captures inside this project will remain in your workspace but will become unassigned.
        </p>
        <div className="flex gap-3 justify-end font-sans">
          <button
            onClick={() => {
              setDeletingFolderId(null);
              setDeletingFolderName('');
            }}
            disabled={isDeletingFolder}
            className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteFolder}
            disabled={isDeletingFolder}
            className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeletingFolder ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </PopupModal>

      {/* Edit Workspace Modal */}
      <PopupModal
        isOpen={showEditWorkspaceModal}
        onClose={() => {
          setShowEditWorkspaceModal(false);
          setEditWorkspaceName('');
          setEditWorkspaceDesc('');
          setEditWorkspaceDept('');
        }}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Edit Workspace</h3>
        <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed font-sans">
          Update your workspace information.
        </p>
        <form onSubmit={handleEditWorkspace} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Workspace Name</label>
            <input
              type="text"
              placeholder="Workspace name"
              value={editWorkspaceName}
              onChange={(e) => setEditWorkspaceName(e.target.value)}
              disabled={isEditingWorkspace}
              autoFocus
              className="w-full bg-[#0a0a0b] border border-[#3f3f46] text-white py-2 px-3 rounded-lg text-sm outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Description</label>
            <input
              type="text"
              placeholder="Short description (optional)"
              value={editWorkspaceDesc}
              onChange={(e) => setEditWorkspaceDesc(e.target.value)}
              disabled={isEditingWorkspace}
              className="w-full bg-[#0a0a0b] border border-[#3f3f46] text-white py-2 px-3 rounded-lg text-sm outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Department</label>
            <select
              value={editWorkspaceDept}
              onChange={(e) => setEditWorkspaceDept(e.target.value)}
              disabled={isEditingWorkspace}
              className="w-full bg-[#0a0a0b] border border-[#3f3f46] text-white py-2 px-3 rounded-lg text-sm outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
            >
              <option value="Engineering & Product">Engineering & Product</option>
              <option value="Design & Creative">Design & Creative</option>
              <option value="Marketing & Sales">Marketing & Sales</option>
              <option value="Operations & HR">Operations & HR</option>
              <option value="Personal & Individual">Personal & Individual</option>
              <option value="Other / Custom">Other / Custom</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowEditWorkspaceModal(false);
                setEditWorkspaceName('');
                setEditWorkspaceDesc('');
                setEditWorkspaceDept('');
              }}
              disabled={isEditingWorkspace}
              className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditingWorkspace || !editWorkspaceName.trim()}
              className="px-4 py-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditingWorkspace ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </PopupModal>
    </aside>
  );
}
