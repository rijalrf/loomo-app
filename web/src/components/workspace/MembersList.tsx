'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/clientLogger';
import PopupModal from '@/components/PopupModal';
import MemberCard from './MemberCard';

interface Member {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  invitedAt: string;
  accepted: boolean;
}

interface MembersListProps {
  activeWorkspaceId: string;
  currentUserId: string;
  isOwner: boolean;
}

export default function MembersList({ activeWorkspaceId, currentUserId, isOwner }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showRemoveModal, setShowRemoveModal] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspace/members?workspaceId=${activeWorkspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (e) {
      clientLogger.error('members-list', 'Failed to fetch workspace members:', e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspaceId]);

  const handleRemoveMember = async (membershipId: string) => {
    setShowRemoveModal(membershipId);
  };

  const confirmRemove = async (membershipId: string) => {
    setShowRemoveModal(null);
    
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
      clientLogger.error('members-list', 'Failed to remove member:', e);
    }
  };

  return (
    <>
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-lg">
        <h3 className="text-base font-black text-white tracking-tight mb-4">Workspace Members</h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {members.map((member) => (
            <MemberCard
              key={member.membershipId}
              member={member}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onRemove={handleRemoveMember}
            />
          ))}
        </div>
      </div>

      <PopupModal
        isOpen={!!showRemoveModal}
        onClose={() => setShowRemoveModal(null)}
        maxWidth="sm"
      >
        <h3 className="text-lg font-semibold text-[#e4e4e7] mb-2 pr-6">Remove Member</h3>
        <p className="text-sm text-[#a1a1aa] mb-6 leading-relaxed">
          Remove this member from the workspace?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowRemoveModal(null)}
            className="px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-[#e4e4e7] rounded-lg text-sm font-semibold hover:bg-[#3f3f46] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => showRemoveModal && confirmRemove(showRemoveModal)}
            className="px-4 py-2 bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
          >
            Remove
          </button>
        </div>
      </PopupModal>
    </>
  );
}
