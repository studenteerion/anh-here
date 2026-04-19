import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarUserMenu } from './SidebarUserMenu';
import type { BaseSidebarProps, NavItem, UserMenuAction } from '@/types/sidebar';

export type { NavItem, UserMenuAction, BaseSidebarProps };

export function BaseSidebar({
  logo,
  title,
  headerHref,
  navItems,
  pathname,
  isCollapsed,
  onCollapseChange,
  isMobileOpen,
  onMobileOpenChange,
  userInitials,
  userFullName,
  userEmail,
  workspaces,
  onWorkspaceSwitchClick,
  userMenuActions,
  isLoading = false,
}: BaseSidebarProps) {
  const closeMobileMenu = () => onMobileOpenChange(false);

  return (
    <>
      <button
        onClick={() => onMobileOpenChange(true)}
        className="fixed top-4 left-4 z-40 lg:hidden rounded-md p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <svg className="h-6 w-6 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileMenu} />}

      <div
        className={cn(
          'fixed lg:relative h-svh lg:h-screen flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-50',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-[86vw] max-w-72'
        )}
      >
        {isCollapsed && (
          <button
            onClick={() => onCollapseChange(false)}
            className="hidden lg:block absolute -right-3 top-8 z-50 rounded-full bg-white dark:bg-zinc-900 p-1.5 shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}

        <SidebarHeader
          href={headerHref}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          logo={logo}
          title={title}
          onCollapse={() => onCollapseChange(true)}
          onCloseMobile={closeMobileMenu}
        />

        <ScrollArea className="flex-1 px-3 py-4">
          <SidebarNav
            items={navItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            onNavigate={closeMobileMenu}
          />
        </ScrollArea>

        <Separator className="bg-zinc-200 dark:bg-zinc-800" />

        {!isLoading && (
          <SidebarUserMenu
            initials={userInitials}
            fullName={userFullName}
            email={userEmail}
            isCollapsed={isCollapsed}
            workspaces={workspaces}
            onWorkspaceClick={onWorkspaceSwitchClick}
            actions={userMenuActions}
          />
        )}
      </div>
    </>
  );
}
