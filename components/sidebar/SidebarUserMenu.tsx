import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface UserMenuAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  isDangerous?: boolean;
}

interface SidebarUserMenuProps {
  initials: string;
  fullName: string;
  email: string;
  isCollapsed: boolean;
  workspaces?: Array<{ type: 'tenant' | 'platform'; tenantId?: number; companyName: string; isCurrent: boolean }>;
  onWorkspaceClick?: () => void;
  actions: UserMenuAction[];
}

export function SidebarUserMenu({
  initials,
  fullName,
  email,
  isCollapsed,
  workspaces,
  onWorkspaceClick,
  actions,
}: SidebarUserMenuProps) {
  const canSwitch = workspaces && workspaces.length > 1;

  return (
    <div className="p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate w-full">{fullName}</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 break-all">{email}</span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {canSwitch && onWorkspaceClick && (
            <>
              <DropdownMenuItem onClick={onWorkspaceClick} className="cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                <span>Cambia sessione</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {actions.map((action, index) => (
            <div key={index}>
              {action.href ? (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={action.href} className="flex items-center">
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={action.onClick}
                  className={cn(
                    'cursor-pointer',
                    action.isDangerous && 'text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300'
                  )}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                </DropdownMenuItem>
              )}

              {index < actions.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
