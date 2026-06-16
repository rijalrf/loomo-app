'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { toast } from 'sonner';
import { Folder, BookOpen, LogOut, ChevronDown, Check, Settings, Users, Plus, Trash2, AlertCircle } from 'lucide-react';

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

interface SelectOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  placeholder = 'Select option',
  size = 'md',
  align = 'left'
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  const py = size === 'sm' ? 'py-1.5' : 'py-2.5';
  const px = size === 'sm' ? 'px-2.5' : 'px-4';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const rounded = size === 'sm' ? 'rounded-lg' : 'rounded-xl';

  const defaultBtnClass = `w-full flex items-center justify-between gap-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white ${px} ${py} ${rounded} ${text} font-semibold outline-none focus:border-[#0CB2EB] focus:ring-1 focus:ring-[#0CB2EB] transition-all cursor-pointer`;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultBtnClass}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 min-w-full w-max max-w-[280px] bg-[#0B0F19]/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1 animate-in fade-in slide-in-from-top-1 duration-150 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
                  option.value === value
                    ? 'bg-[#0CB2EB]/15 text-[#0CB2EB] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                {option.icon}
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check size={14} className="text-[#0CB2EB] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceDept, setNewWorkspaceDept] = useState('Engineering & Product');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  
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
      const data = await res.json();
      if (res.ok) {
        toast.success(`Workspace "${newWorkspaceName}" created successfully!`);
        setWorkspaces(prev => [...prev, data.workspace]);
        setActiveWorkspaceId(data.workspace.id);
        setShowCreateModal(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
        setNewWorkspaceDept('Engineering & Product');
      } else {
        toast.error(data.error || 'Failed to create workspace');
      }
    } catch (err) {
      toast.error('Network error. Failed to create workspace.');
    } finally {
      setCreatingWorkspace(false);
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
    if (!confirm('Remove this member from the workspace?')) return;
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

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0B0F19] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div className="flex flex-col gap-6 p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="Loomo Logo" className="w-7 h-7 object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl font-black tracking-tighter text-white">Loomo</span>
          </div>

          <div className="h-px bg-slate-800"></div>

          {/* Workspace Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workspace</label>
            <CustomSelect
              value={activeWorkspaceId}
              onChange={(val) => {
                if (val === 'CREATE_NEW') {
                  setShowCreateModal(true);
                } else {
                  setActiveWorkspaceId(val);
                }
              }}
              options={[
                ...workspaces.map(w => ({
                  value: w.id,
                  label: `${w.name} ${w.isOwner ? '(Owner)' : ''}`,
                  icon: <span className="w-1.5 h-1.5 rounded-full bg-[#0CB2EB]" />
                })),
                {
                  value: 'CREATE_NEW',
                  label: 'Create Workspace',
                  icon: <Plus size={14} className="text-[#0CB2EB]" />
                }
              ]}
              className="w-full"
              buttonClassName="w-full flex items-center justify-between gap-2 bg-[#1E293B]/40 hover:bg-[#1E293B]/80 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-[#0CB2EB] transition-all cursor-pointer"
            />
          </div>

          {/* Sidebar Menu */}
          <nav className="flex flex-col gap-1.5 mt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation</label>
            
            <button
              onClick={() => {
                router.push('/');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <Folder size={18} />
              <span>All Media</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#0CB2EB]/15 text-[#0CB2EB] border-l-2 border-[#0CB2EB] transition-all cursor-pointer"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <BookOpen size={18} />
              <span>Documentation</span>
            </a>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080D16]/50">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-bold text-slate-400 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-slate-800/80 rounded-md text-[10px] font-black uppercase text-[#0CB2EB] tracking-wider border border-slate-700/60">
              Settings
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300 font-bold">{activeWorkspace?.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-sm font-bold text-white leading-none">{initialUser.displayName}</div>
              <div className="text-[10px] text-slate-500 font-medium">{initialUser.email}</div>
            </div>
            {initialUser.avatarUrl ? (
              <img 
                src={initialUser.avatarUrl} 
                alt={initialUser.displayName} 
                className="w-9 h-9 rounded-full border border-slate-700 p-0.5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">
                {initialUser.displayName[0]}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-10 w-full max-w-4xl">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              Workspace Settings
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Manage members and invitations for <span className="text-[#0CB2EB]">{activeWorkspace?.name}</span>.
            </p>
          </div>

          <div className="space-y-8">
            {/* Invite New Member */}
            {activeWorkspace?.isOwner ? (
              <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-3xl">
                <h3 className="text-base font-black text-white tracking-tight mb-2">Invite New Member</h3>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Send an invitation to join this workspace. Invited users will be able to upload, view, and share captures.
                </p>

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-text flex-1 bg-slate-950/40 border-slate-800 focus:border-[#0CB2EB] text-sm py-2.5 rounded-xl outline-none transition-all"
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
                    buttonClassName="w-full flex items-center justify-between gap-2 bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-[#0CB2EB] transition-all cursor-pointer"
                  />
                  <button type="submit" className="btn-primary py-2.5 px-6 rounded-xl text-sm shadow-[#0CB2EB]/20 justify-center cursor-pointer">
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
                  <div className="text-[#0CB2EB] text-xs mt-4 font-bold flex items-center gap-2">
                    <Check size={12} className="text-[#0CB2EB]" />
                    Invitation sent successfully!
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/50 p-6 rounded-2xl text-slate-400 text-xs font-semibold">
                Only workspace owners can invite new members or manage membership settings.
              </div>
            )}

            {/* Members List */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-3xl">
              <h3 className="text-base font-black text-white tracking-tight mb-6">Workspace Members</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div 
                    key={member.membershipId}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/20 border border-slate-800/80 hover:border-slate-700/60 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.displayName}
                          className="w-10 h-10 rounded-full border border-slate-800 p-0.5" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-sm font-black text-white">
                          {member.displayName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {member.displayName}
                          {!member.accepted && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black tracking-widest">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-[#8A5CF6] uppercase tracking-widest bg-[#8A5CF6]/5 px-2.5 py-1 rounded-md border border-[#8A5CF6]/10">
                        {member.role}
                      </span>

                      {activeWorkspace?.isOwner && member.userId !== initialUser.id && (
                        <button
                          onClick={() => handleRemoveMember(member.membershipId)}
                          className="text-slate-500 hover:text-red-400 p-2 rounded-xl bg-slate-900/40 hover:bg-red-500/10 border border-slate-800/80 hover:border-red-500/20 transition-all cursor-pointer"
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl border-slate-700/50 p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">Create Workspace</h3>
              <button 
                onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); setNewWorkspaceDesc(''); setNewWorkspaceDept('Engineering & Product'); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marketing Team, Personal Projects..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-[#0CB2EB] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Collaborative space for marketing team (optional)..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-[#0CB2EB] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department / Team</label>
                <select
                  value={newWorkspaceDept}
                  onChange={(e) => setNewWorkspaceDept(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#0CB2EB] text-sm py-2.5 px-4 rounded-xl outline-none text-white transition-all cursor-pointer font-medium"
                >
                  <option value="Engineering & Product" className="bg-[#0B0F19] text-white">Engineering & Product</option>
                  <option value="Design & Creative" className="bg-[#0B0F19] text-white">Design & Creative</option>
                  <option value="Marketing & Sales" className="bg-[#0B0F19] text-white">Marketing & Sales</option>
                  <option value="Operations & HR" className="bg-[#0B0F19] text-white">Operations & HR</option>
                  <option value="Personal & Individual" className="bg-[#0B0F19] text-white">Personal & Individual</option>
                  <option value="Other / Custom" className="bg-[#0B0F19] text-white">Other / Custom</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); setNewWorkspaceDesc(''); setNewWorkspaceDept('Engineering & Product'); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800/40 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWorkspace || !newWorkspaceName.trim()}
                  className="btn-primary py-2.5 px-6 rounded-xl text-xs shadow-[#0CB2EB]/20 justify-center disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
