'use client';

import { Trash2 } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';

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

interface MemberCardProps {
  member: Member;
  currentUserId: string;
  isOwner: boolean;
  onRemove: (membershipId: string) => void;
}

export default function MemberCard({ member, currentUserId, isOwner, onRemove }: MemberCardProps) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-main)]/40 border border-[var(--border-color)] hover:border-[var(--primary)]/20 transition-all">
      <div className="flex items-center gap-4">
        <UserAvatar user={{ displayName: member.displayName, avatarUrl: member.avatarUrl }} size="md" />
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

        {isOwner && member.userId !== currentUserId && (
          <button
            onClick={() => onRemove(member.membershipId)}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-red-500/10 border border-[var(--border-color)] hover:border-red-500/20 transition-all cursor-pointer"
            title="Remove from workspace"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
