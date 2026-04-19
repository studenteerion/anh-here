/**
 * Sidebar Component Types
 * Shared types used across sidebar components
 */

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface UserMenuAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  isDangerous?: boolean;
}

export interface BaseSidebarProps {
  logo: string;
  title: string;
  headerHref: string;
  navItems: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  userInitials: string;
  userFullName: string;
  userEmail: string;
  workspaces?: Array<{
    type: 'tenant' | 'platform';
    tenantId?: number;
    companyName: string;
    isCurrent: boolean;
  }>;
  onWorkspaceSwitchClick?: () => void;
  userMenuActions: UserMenuAction[];
  isLoading?: boolean;
}

export interface SidebarHeaderProps {
  href: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  logo: string;
  title: string;
  onCollapse: () => void;
  onCloseMobile: () => void;
}

export interface SidebarNavProps {
  items: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onNavigate?: () => void;
}

export interface SidebarUserMenuProps {
  initials: string;
  fullName: string;
  email: string;
  isCollapsed: boolean;
  workspaces?: Array<{
    type: 'tenant' | 'platform';
    tenantId?: number;
    companyName: string;
    isCurrent: boolean;
  }>;
  onWorkspaceClick?: () => void;
  actions: UserMenuAction[];
}
