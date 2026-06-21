'use client';

import { useState } from 'react';
import { Plus, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

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

interface InviteFormProps {
  activeWorkspaceId: string;
  isOwner: boolean;
  onInviteSuccess: () => void;
}

export default function InviteForm({ activeWorkspaceId, isOwner, onInviteSuccess }: InviteFormProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    const emailToValidate = inviteEmail.trim().toLowerCase();
    if (!emailToValidate.endsWith('@gmail.com')) {
      const errorMsg = 'Only Gmail addresses (@gmail.com) are allowed.';
      setInviteError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToValidate,
          role: 'MEMBER', // Default to MEMBER as dropdown is removed
          workspaceId: activeWorkspaceId
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent successfully to ${emailToValidate}`);
        setInviteSuccess(true);
        setInviteEmail('');
        onInviteSuccess();
      } else {
        toast.error(data.error || 'Invitation failed');
        setInviteError(data.error || 'Invitation failed');
      }
    } catch (err) {
      toast.error('Network error. Failed to send invitation.');
      setInviteError('Network error');
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)]/50 p-4 rounded-lg text-slate-400 text-xs font-semibold">
        Only workspace owners can invite new members or manage membership settings.
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg">
      <h3 className="text-base font-black text-white tracking-tight mb-2">Invite New Member</h3>
      <p className="text-xs text-slate-500 font-medium mb-4">
        Send an invitation to join this workspace. Invited users will be able to upload, view, and share captures.
      </p>

      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Gmail address (e.g. user@gmail.com)..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="input-text flex-1 bg-[var(--bg-main)]/60 border border-[var(--border-color)] focus:border-[var(--primary)] text-sm py-2 rounded-lg outline-none transition-all"
          required
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
  );
}
