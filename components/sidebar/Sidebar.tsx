'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  AlertCircle,
  FileText,
  Clock,
  UserCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Presenze',
    href: '/dashboard/attendances',
    icon: UserCheck,
  },
  {
    title: 'Turni',
    href: '/dashboard/shifts',
    icon: Clock,
  },
  {
    title: 'Dipendenti',
    href: '/dashboard/employees',
    icon: Users,
  },
  {
    title: 'Dipartimenti',
    href: '/dashboard/departments',
    icon: Building2,
  },
  {
    title: 'Ruoli',
    href: '/dashboard/roles',
    icon: Shield,
  },
  {
    title: 'Anomalie',
    href: '/dashboard/anomalies',
    icon: AlertCircle,
  },
  {
    title: 'Report',
    href: '/dashboard/reports',
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [me, setMe] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  const initials = useMemo(() => {
    if (!me) return 'U';
    return `${me.firstName?.[0] || ''}${me.lastName?.[0] || ''}`.toUpperCase() || 'U';
  }, [me]);

  const fullName = me ? `${me.firstName} ${me.lastName}` : 'Utente';
  const email = me?.email || 'user@anh-here.com';

  useEffect(() => {
    let mounted = true;

    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        const json = await res.json();
        if (mounted && json.status === 'success') {
          setMe(json.data);
        }
      } catch {
        // no-op fallback to placeholder
      }
    };

    if (pathname?.startsWith('/dashboard')) {
      loadMe();
    }

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden rounded-md p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Menu className="h-6 w-6 text-zinc-900 dark:text-white" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:relative h-screen flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-50',
          // Mobile styles
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop styles
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile always full width when open
          'w-64'
        )}
      >
      {/* Expand/Collapse Button - Desktop only */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:block absolute -right-3 top-8 z-50 rounded-full bg-white dark:bg-zinc-900 p-1.5 shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
        </button>
      )}
      
      {/* Header con Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {(!isCollapsed || isMobileOpen) && (
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={closeMobileMenu}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
              A
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              ANH-here
            </span>
          </Link>
        )}
        {isCollapsed && !isMobileOpen && (
          <Link href="/dashboard" className="mx-auto hidden lg:block">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
              A
            </div>
          </Link>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:block rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Fix: Dashboard should only be active when pathname is exactly '/dashboard'
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
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
                {(!isCollapsed || isMobileOpen) && (
                  <span className={cn(isCollapsed && 'lg:hidden')}>{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      {/* User Menu */}
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
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate w-full">
                    {fullName}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 break-all">
                    {email}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{fullName}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 break-all">{email}</p>
            </div>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Impostazioni</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Uscita in corso...' : 'Esci'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  );
}
