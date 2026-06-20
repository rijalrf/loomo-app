import UserAvatar from '../ui/UserAvatar';
import Breadcrumbs from '../ui/Breadcrumbs';

interface User {
  displayName: string;
  avatarUrl: string | null;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

interface PageHeaderProps {
  user: User;
  breadcrumbs: BreadcrumbItem[];
}

export default function PageHeader({ user, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-main)] backdrop-blur-md sticky top-0 z-20">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="sm" />
      </div>
    </header>
  );
}
