interface User {
  displayName: string;
  avatarUrl: string | null;
}

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

export default function UserAvatar({ user, size = 'sm', className = '' }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.displayName}
      className={`${sizeClass} rounded-lg border border-[var(--border-color)] object-cover ${className}`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={`${sizeClass} rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold ${className}`}
    >
      {user.displayName[0].toUpperCase()}
    </div>
  );
}
