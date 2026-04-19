'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LogOut, Settings } from 'lucide-react';
import { BaseSidebar, type NavItem } from '@/components/sidebar/BaseSidebar';
import type { UserMenuAction } from '@/components/sidebar/SidebarUserMenu';

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/platform/dashboard',
    icon: Building2,
  },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch {
      // no-op
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

  const userMenuActions: UserMenuAction[] = [
    {
      label: 'Impostazioni',
      icon: Settings,
      href: '/platform/settings',
    },
    {
      label: 'Esci',
      icon: LogOut,
      onClick: handleLogout,
      isDangerous: true,
    },
  ];

  return (
    <>
      <BaseSidebar
        logo="P"
        title="Tenant Manager"
        headerHref="/platform/dashboard"
        navItems={navItems}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onCollapseChange={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileOpenChange={setIsMobileOpen}
        userInitials={initials}
        userFullName={me ? `${me.firstName} ${me.lastName}` : 'Platform user'}
        userEmail={me?.email || 'platform@anh-here.com'}
        workspaces={canSwitch ? workspaces : undefined}
        onWorkspaceSwitchClick={() => setIsWorkspaceModalOpen(true)}
        userMenuActions={userMenuActions}
      />

      {isWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsWorkspaceModalOpen(false)}
            aria-label="Chiudi selezione sessione"
          />
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
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    ws.isCurrent
                      ? 'border-zinc-400/50 bg-zinc-100 dark:bg-zinc-800 cursor-default'
                      : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
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
