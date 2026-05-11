import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SidebarNavProps } from '@/types/sidebar';

export function SidebarNav({ items, pathname, isCollapsed, isMobileOpen, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-col space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        // Dashboard should only be active when pathname is exactly '/dashboard' or '/platform/dashboard'
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : item.href === '/platform/dashboard'
              ? pathname === '/platform/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
            title={isCollapsed ? item.title : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className={cn(isCollapsed && 'lg:hidden')}>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
