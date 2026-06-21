import Sidebar from '../Sidebar';
import PageHeader from './PageHeader';
import PageContent from './PageContent';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  saveToOwnerDrive?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

interface AppLayoutProps {
  user: User;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  onCreateWorkspaceClick: () => void;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
  contentMaxWidth?: 'full' | '6xl' | '7xl';
  activeFolderId?: string | null;
  setActiveFolderId?: (id: string | null) => void;
}

export default function AppLayout({
  user,
  workspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  onCreateWorkspaceClick,
  breadcrumbs,
  children,
  contentMaxWidth = 'full',
  activeFolderId = null,
  setActiveFolderId
}: AppLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-200">
      <Sidebar
        initialUser={user}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onCreateWorkspaceClick={onCreateWorkspaceClick}
        activeFolderId={activeFolderId}
        setActiveFolderId={(id) => {
          if (setActiveFolderId) {
            setActiveFolderId(id);
          }
          if (id) {
            localStorage.setItem('loomo_active_folder_id', id);
          } else {
            localStorage.removeItem('loomo_active_folder_id');
          }
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <PageHeader user={user} breadcrumbs={breadcrumbs} />
        <PageContent maxWidth={contentMaxWidth}>{children}</PageContent>
      </div>
    </div>
  );
}
