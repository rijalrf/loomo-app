'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import { Folder, BookOpen, LogOut, ChevronDown, Check, Settings, Users, Plus, Trash2, AlertCircle, LayoutDashboard, Search, Bell, Mail, HelpCircle, ArrowUpRight } from 'lucide-react';
import { showConfirm } from '@/lib/customDialog';
import Sidebar from './Sidebar';

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

interface Member {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  role: string;
  invitedAt: string;
  accepted: boolean;
}

interface SettingsClientProps {
  initialUser: User;
  initialWorkspaces: Workspace[];
}

import CustomSelect from './CustomSelect';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function SettingsClient({
  initialUser,
  initialWorkspaces
}: SettingsClientProps) {
  const router = useRouter();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    initialWorkspaces[0]?.id || ''
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  
  // Sync workspace with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loomo_active_workspace_id');
    if (saved && workspaces.some(w => w.id === saved)) {
      setActiveWorkspaceId(saved);
    }
  }, [workspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('loomo_active_workspace_id', activeWorkspaceId);
      fetchMembers();
    }
  }, [activeWorkspaceId]);

  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'OWNER'>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [updatingStorage, setUpdatingStorage] = useState(false);

  // Active Workspace
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Load Workspace Members
  const fetchMembers = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspace/members?workspaceId=${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (e) {
      clientLogger.error('settings-client', 'Failed to fetch workspace members:', e);
    }
  };



  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId: activeWorkspaceId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent successfully to ${inviteEmail}`);
        setInviteSuccess(true);
        setInviteEmail('');
        fetchMembers();
      } else {
        toast.error(data.error || 'Invitation failed');
        setInviteError(data.error || 'Invitation failed');
      }
    } catch (err) {
      toast.error('Network error. Failed to send invitation.');
      setInviteError('Network error');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    const confirmed = await showConfirm('Remove this member from the workspace?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/workspace/members/${membershipId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Member removed successfully');
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (e) {
      toast.error('Failed to remove member');
      clientLogger.error('settings-client', 'Failed to remove member:', e);
    }
  };

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
        setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, saveToOwnerDrive: data.workspace.saveToOwnerDrive } : w));
      } else {
        toast.error(data.error || 'Failed to update storage settings');
      }
    } catch (e) {
      clientLogger.error('settings-client', 'Failed to update workspace storage settings:', e);
      toast.error('Network error. Failed to update storage settings.');
    } finally {
      setUpdatingStorage(false);
    }
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-200">
      {/* Sidebar */}
      <Sidebar
        initialUser={initialUser}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onCreateWorkspaceClick={() => setShowCreateModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-main)] backdrop-blur-md sticky top-0 z-20">
          {/* Breadcrumbs in style of All Captures > Settings */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-500 hover:text-slate-300 cursor-pointer" onClick={() => router.push('/')}>All Captures</span>
            <span className="text-slate-600 font-medium">&gt;</span>
            <span className="text-[var(--primary)]">Settings</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* User Profile Avatar */}
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-xs font-bold">
                {initialUser.displayName[0]}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-5 w-full max-w-4xl">
          <div className="mb-5">
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              Workspace Settings
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Manage members and invitations for <span className="text-[var(--primary)]">{activeWorkspace?.name}</span>.
            </p>
          </div>

          <div className="space-y-6">
            {/* Invite New Member */}
            {activeWorkspace?.isOwner ? (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg">
                <h3 className="text-base font-black text-white tracking-tight mb-2">Invite New Member</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Send an invitation to join this workspace. Invited users will be able to upload, view, and share captures.
                </p>

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-text flex-1 bg-[var(--bg-main)]/60 border border-[var(--border-color)] focus:border-[var(--primary)] text-sm py-2 rounded-lg outline-none transition-all"
                    required
                  />
                  <CustomSelect
                    value={inviteRole}
                    onChange={(val) => setInviteRole(val as any)}
                    options={[
                      { value: 'MEMBER', label: 'Member' },
                      { value: 'OWNER', label: 'Owner' }
                    ]}
                    size="md"
                    className="w-full sm:w-32"
                    buttonClassName="w-full flex items-center justify-between gap-2 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                  />
                  <button type="submit" className="btn-primary py-1.5 px-4 rounded-lg text-sm justify-center cursor-pointer">
                    <Plus size={16} />
                    <span>Invite</span>
                  </button>
                </form>

                {inviteError && (
                  <div className="text-red-400 text-xs mt-4 font-bold flex items-center gap-2">
                    <AlertCircle size={12} />
                    {inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="text-[var(--primary)] text-xs mt-4 font-bold flex items-center gap-2">
                    <Check size={12} className="text-[var(--primary)]" />
                    Invitation sent successfully!
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)]/50 p-4 rounded-lg text-slate-400 text-xs font-semibold">
                Only workspace owners can invite new members or manage membership settings.
              </div>
            )}

            {/* Workspace Storage Settings */}
            {activeWorkspace?.isOwner && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-base font-black text-white tracking-tight mb-2">Workspace Storage Location</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Configure where files (screenshots and recordings) uploaded by members are saved. By default, files are uploaded to the workspace owner&apos;s Google Drive.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      disabled={updatingStorage}
                      onClick={() => handleUpdateStorageSetting(true)}
                      className={`flex items-start gap-4 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeWorkspace.saveToOwnerDrive !== false
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-white shadow-[0_0_15px_rgba(255,115,0,0.05)]'
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-color)]/80 text-slate-400'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          activeWorkspace.saveToOwnerDrive !== false ? 'border-[var(--primary)]' : 'border-[var(--border-color)]'
                        }`}>
                          {activeWorkspace.saveToOwnerDrive !== false && (
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-1">Workspace Owner&apos;s Google Drive (Default)</div>
                        <p className="text-xs text-slate-400">
                          All files uploaded by members will be stored in the workspace owner&apos;s Google Drive. Recommended for team-wide storage consolidation.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={updatingStorage}
                      onClick={() => handleUpdateStorageSetting(false)}
                      className={`flex items-start gap-4 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeWorkspace.saveToOwnerDrive === false
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-white shadow-[0_0_15px_rgba(255,115,0,0.05)]'
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-color)]/80 text-slate-400'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          activeWorkspace.saveToOwnerDrive === false ? 'border-[var(--primary)]' : 'border-[var(--border-color)]'
                        }`}>
                          {activeWorkspace.saveToOwnerDrive === false && (
                            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-1">Individual Member&apos;s Google Drive</div>
                        <p className="text-xs text-slate-400">
                          Files will be stored in the personal Google Drive of the member who uploads them. Useful for individual quota conservation.
                        </p>
                      </div>
                    </button>
                  </div>

                  {updatingStorage && (
                    <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold mt-2 animate-pulse">
                      <div className="w-3.5 h-3.5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
                      <span>Saving storage configuration...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg">
              <h3 className="text-base font-black text-white tracking-tight mb-4">Workspace Members</h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div 
                    key={member.membershipId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-main)]/40 border border-[var(--border-color)] hover:border-[var(--primary)]/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.displayName}
                          className="w-10 h-10 rounded-full border border-[var(--border-color)] p-0.5" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-sm font-black text-white">
                          {member.displayName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {member.displayName}
                          {!member.accepted && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-lg border border-amber-500/20 uppercase font-black tracking-widest">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-[var(--secondary)] uppercase tracking-widest bg-[var(--secondary)]/5 px-2.5 py-1 rounded-lg border border-[var(--secondary)]/10">
                        {member.role}
                      </span>

                      {activeWorkspace?.isOwner && member.userId !== initialUser.id && (
                        <button
                          onClick={() => handleRemoveMember(member.membershipId)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-red-500/10 border border-[var(--border-color)] hover:border-red-500/20 transition-all cursor-pointer"
                          title="Remove from workspace"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newWs) => {
          setWorkspaces((prev) => [...prev, newWs]);
          setActiveWorkspaceId(newWs.id);
          setShowCreateModal(false);
        }}
      />

      </div>
    </div>
  );
}
