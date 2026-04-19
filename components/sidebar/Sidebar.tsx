'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { BaseSidebar, type NavItem } from './BaseSidebar';
import type { UserMenuAction } from './SidebarUserMenu';

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
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [me, setMe] = useState<{ firstName: string; lastName: string; email: string; tenantName: string | null } | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ type: 'tenant' | 'platform'; tenantId?: number; companyName: string; isCurrent: boolean }>>([]);

  const initials = useMemo(() => {
    if (!me) return 'U';
    return `${me.firstName?.[0] || ''}${me.lastName?.[0] || ''}`.toUpperCase() || 'U';
  }, [me]);

  const fullName = me ? `${me.firstName} ${me.lastName}` : 'Utente';
  const email = me?.email || 'user@anh-here.com';
  const tenantName = me?.tenantName || 'Tenant';
  const tenantInitial = tenantName.trim().charAt(0).toUpperCase() || 'T';

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

    const loadWorkspaces = async () => {
      try {
        const res = await fetch('/api/auth/workspaces', {
          credentials: 'include',
        });
        const json = await res.json();
        if (mounted && json.status === 'success') {
          setWorkspaces(json.data?.workspaces || []);
        }
      } catch {
        // no-op fallback
      }
    };

    if (pathname?.startsWith('/dashboard')) {
      loadMe();
      loadWorkspaces();
    }

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const handleSwitchCompany = async (workspace: { type: 'tenant' | 'platform'; tenantId?: number }) => {
    setIsSwitchingCompany(true);
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
      if (json.status !== 'success') {
        console.error('Errore cambio azienda:', json.message);
        return;
      }
      setIsCompanyModalOpen(false);
      router.push(json.redirectTo || '/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Errore durante il cambio azienda:', error);
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  const userMenuActions: UserMenuAction[] = [
    {
      label: 'Impostazioni',
      icon: Settings,
      href: '/dashboard/settings',
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
        logo={tenantInitial}
        title={tenantName}
        headerHref="/dashboard"
        navItems={navItems}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onCollapseChange={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileOpenChange={setIsMobileOpen}
        userInitials={initials}
        userFullName={fullName}
        userEmail={email}
        workspaces={workspaces}
        onWorkspaceSwitchClick={() => setIsCompanyModalOpen(true)}
        userMenuActions={userMenuActions}
      />

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCompanyModalOpen(false)}
            aria-label="Chiudi selezione azienda"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-semibold">Seleziona sessione</h3>
            <p className="text-sm text-muted-foreground">
              Scegli il contesto da usare per questa sessione.
            </p>
            <div className="space-y-2">
              {workspaces.map((company, index) => (
                <button
                  key={`${company.type}-${company.tenantId ?? index}`}
                  type="button"
                  onClick={() => handleSwitchCompany(company)}
                  disabled={isSwitchingCompany || company.isCurrent}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    company.isCurrent
                      ? 'border-zinc-400/50 bg-zinc-100 dark:bg-zinc-800 cursor-default'
                      : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-medium text-zinc-900 dark:text-white">{company.companyName}</div>
                  {company.isCurrent && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Sessione attiva</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
