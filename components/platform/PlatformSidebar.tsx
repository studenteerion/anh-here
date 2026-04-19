'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ChevronLeft, ChevronRight, LogOut, Menu, X, Settings } from 'lucide-react';
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

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [me, setMe] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ type: 'tenant' | 'platform'; tenantId?: number; companyName: string; isCurrent: boolean }>>([]);

  const initials = useMemo(() => {
    if (!me) return 'P';
    return `${me.firstName?.[0] || ''}${me.lastName?.[0] || ''}`.toUpperCase() || 'P';
  }, [me]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [meRes, wsRes] = await Promise.all([
          fetch('/api/platform/me', { credentials: 'include' }),
          fetch('/api/auth/workspaces', { credentials: 'include' }),
        ]);
        const meJson = await meRes.json();
        const wsJson = await wsRes.json();
        if (!mounted) return;
        if (meJson.status === 'success') setMe(meJson.data);
        if (wsJson.status === 'success') setWorkspaces(wsJson.data?.workspaces || []);
      } catch {
        // no-op
      }
    };

    if (pathname?.startsWith('/platform')) load();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleSwitch = async (workspace: { type: 'tenant' | 'platform'; tenantId?: number }) => {
    setIsSwitching(true);
    try {
      const response = await fetch('/api/auth/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          workspace.type === 'platform'
            ? { type: 'platform' }
            : { type: 'tenant', tenantId: workspace.tenantId }
        ),
      });
      const json = await response.json();
      if (json.status !== 'success') return;
      setIsWorkspaceModalOpen(false);
      router.push(json.redirectTo || '/platform/dashboard');
      router.refresh();
    } finally {
      setIsSwitching(false);
    }
  };

  const canSwitch = workspaces.length > 1;
  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden rounded-md p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Menu className="h-6 w-6 text-zinc-900 dark:text-white" />
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
            onClick={() => setIsCollapsed(false)}
            className="hidden lg:block absolute -right-3 top-8 z-50 rounded-full bg-white dark:bg-zinc-900 p-1.5 shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}

        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <button onClick={closeMobileMenu} className="lg:hidden rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>

          {(!isCollapsed || isMobileOpen) && (
            <Link href="/platform/dashboard" className="flex items-center gap-2.5 group" onClick={closeMobileMenu}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
                P
              </div>
              <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white truncate max-w-44 sm:max-w-56">
                Tenant Manager
              </span>
            </Link>
          )}
          {isCollapsed && !isMobileOpen && (
            <Link href="/platform/dashboard" className="mx-auto hidden lg:block">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold transition-colors">
                P
              </div>
            </Link>
          )}
          {!isCollapsed && (
            <button onClick={() => setIsCollapsed(true)} className="hidden lg:block rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/platform/dashboard"
              onClick={closeMobileMenu}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === '/platform/dashboard'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                isCollapsed && 'lg:justify-center lg:px-2'
              )}
            >
              <Building2 className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className={cn(isCollapsed && 'lg:hidden')}>Dashboard</span>}
            </Link>
          </nav>
        </ScrollArea>

        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
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
                    <span className="text-sm font-medium text-zinc-900 dark:text-white truncate w-full">{me ? `${me.firstName} ${me.lastName}` : 'Platform user'}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 break-all">{me?.email || 'platform@anh-here.com'}</span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {canSwitch && (
                <>
                  <DropdownMenuItem onClick={() => setIsWorkspaceModalOpen(true)} className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Cambia sessione</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/platform/settings" className="flex items-center">
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

      {isWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setIsWorkspaceModalOpen(false)} aria-label="Chiudi selezione sessione" />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-semibold">Seleziona sessione</h3>
            <p className="text-sm text-muted-foreground">Scegli il contesto da usare per questa sessione.</p>
            <div className="space-y-2">
              {workspaces.map((ws, index) => (
                <button
                  key={`${ws.type}-${ws.tenantId ?? index}`}
                  type="button"
                  onClick={() => handleSwitch(ws)}
                  disabled={isSwitching || ws.isCurrent}
                  className={cn(
                    'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                    ws.isCurrent ? 'border-zinc-400/50 bg-zinc-100 dark:bg-zinc-800 cursor-default' : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  )}
                >
                  <div className="font-medium text-zinc-900 dark:text-white">{ws.companyName}</div>
                  {ws.isCurrent && <div className="text-xs text-zinc-500 dark:text-zinc-400">Sessione attiva</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
