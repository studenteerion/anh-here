import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { SidebarHeaderProps } from '@/types/sidebar';

export function SidebarHeader({
  href,
  isCollapsed,
  isMobileOpen,
  logo,
  title,
  onCollapse,
  onCloseMobile,
}: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
      <button
        onClick={onCloseMobile}
        className="lg:hidden rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <svg
          className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {(!isCollapsed || isMobileOpen) && (
        <Link href={href} className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
            {logo}
          </div>
          <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white truncate max-w-44 sm:max-w-56">
            {title}
          </span>
        </Link>
      )}

      {isCollapsed && !isMobileOpen && (
        <Link href={href} className="mx-auto hidden lg:block">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
            {logo}
          </div>
        </Link>
      )}

      {!isCollapsed && (
        <button
          onClick={onCollapse}
          className="hidden lg:block rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      )}
    </div>
  );
}
