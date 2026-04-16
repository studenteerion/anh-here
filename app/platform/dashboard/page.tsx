'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type PlatformMe = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
};

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<PlatformMe | null>(null);
  const [tenants, setTenants] = useState<Array<{ id: number; name: string; status: string; createdAt: string }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [isRefreshingTenants, setIsRefreshingTenants] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    tenantName: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    departmentName: 'Amministrazione',
  });

  const loadTenants = async () => {
    const tenantsRes = await fetch('/api/platform/tenants', { credentials: 'include' });
    if (!tenantsRes.ok) return;
    const tenantsJson = await tenantsRes.json();
    setTenants(tenantsJson.data?.tenants || []);
  };

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/platform/me', { credentials: 'include' });
      if (meRes.ok) {
        const meJson = await meRes.json();
        setMe(meJson.data || null);
      }
      await loadTenants();
    };
    load();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Errore creazione tenant');
        return;
      }
      setSuccess(`Tenant creato con ID ${json.data.tenantId}.`);
      await loadTenants();
      setIsCreateModalOpen(false);
      setForm({
        tenantName: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        departmentName: 'Amministrazione',
      });
    } catch {
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshTenants = async () => {
    setIsRefreshingTenants(true);
    try {
      await loadTenants();
    } finally {
      setIsRefreshingTenants(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold">Dashboard tenant manager</h1>
          <p className="text-muted-foreground mt-2">
            {me ? `Benvenuto ${me.firstName} ${me.lastName}` : 'Gestione tenant e onboarding aziende'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white dark:bg-zinc-950 p-5">
            <p className="text-sm text-muted-foreground">Tenant totali</p>
            <p className="text-3xl font-bold mt-1">{tenants.length}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-zinc-950 p-5">
            <p className="text-sm text-muted-foreground">Tenant attivi</p>
            <p className="text-3xl font-bold mt-1">{tenants.filter((t) => t.status === 'active').length}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-zinc-950 p-5">
            <p className="text-sm text-muted-foreground">Tenant non attivi</p>
            <p className="text-3xl font-bold mt-1">{tenants.filter((t) => t.status !== 'active').length}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-zinc-950 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess('');
                setIsCreateModalOpen(true);
              }}
              className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
            >
              Crea tenant
            </button>
            <button
              type="button"
              onClick={handleRefreshTenants}
              disabled={isRefreshingTenants}
              className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
            >
              {isRefreshingTenants ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-zinc-950 p-5">
          <h2 className="text-lg font-medium mb-4">Tenant presenti</h2>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 pr-2">Nome</th>
                  <th className="py-2 pr-2">Stato</th>
                  <th className="py-2 pr-2">Creato il</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2 pr-2">{tenant.id}</td>
                    <td className="py-2 pr-2 font-medium">{tenant.name}</td>
                    <td className="py-2 pr-2">{tenant.status}</td>
                    <td className="py-2 pr-2">{new Date(tenant.createdAt).toLocaleDateString('it-IT')}</td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={4}>
                      Nessun tenant presente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCreateModalOpen(false)}
            aria-label="Chiudi creazione tenant"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-white dark:bg-zinc-950 p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Crea nuovo tenant</h3>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
              <input
                className="rounded-md border px-3 py-2 bg-transparent sm:col-span-2"
                placeholder="Nome tenant"
                value={form.tenantName}
                onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
                required
              />
              <input
                className="rounded-md border px-3 py-2 bg-transparent"
                placeholder="Nome admin"
                value={form.adminFirstName}
                onChange={(e) => setForm((f) => ({ ...f, adminFirstName: e.target.value }))}
                required
              />
              <input
                className="rounded-md border px-3 py-2 bg-transparent"
                placeholder="Cognome admin"
                value={form.adminLastName}
                onChange={(e) => setForm((f) => ({ ...f, adminLastName: e.target.value }))}
                required
              />
              <input
                type="email"
                className="rounded-md border px-3 py-2 bg-transparent sm:col-span-2"
                placeholder="Email admin"
                value={form.adminEmail}
                onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                required
              />
              <input
                type="password"
                className="rounded-md border px-3 py-2 bg-transparent"
                placeholder="Password admin"
                value={form.adminPassword}
                onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                required
              />
              <input
                className="rounded-md border px-3 py-2 bg-transparent"
                placeholder="Dipartimento iniziale"
                value={form.departmentName}
                onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
              />
              <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {saving ? 'Creazione in corso...' : 'Crea tenant + admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
