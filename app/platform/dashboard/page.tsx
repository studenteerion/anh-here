'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TenantStats from '@/components/tenants/TenantStats';
import TenantList from '@/components/tenants/TenantList';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { PlatformMe } from '@/types/tenants';

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const [me, setMe] = useState<PlatformMe | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    tenantName: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    departmentName: 'Amministrazione',
  });

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/platform/me', { credentials: 'include' });
      if (meRes.ok) {
        const meJson = await meRes.json();
        setMe(meJson.data || null);
      }
    };
    load();
  }, []);

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
      setStatsRefreshKey((prev) => prev + 1);
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

  const handleTableRefreshed = () => {
    setStatsRefreshKey((prev) => prev + 1);
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
      <div className="mx-auto max-w-7xl space-y-6">

        <TenantStats refreshKey={statsRefreshKey} />

        <TenantList
          onAddTenant={() => {
            setError('');
            setSuccess('');
            setIsCreateModalOpen(true);
          }}
          onRefreshed={handleTableRefreshed}
          onTenantDeleted={handleTableRefreshed}
        />
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCreateModalOpen(false)}
            aria-label="Chiudi creazione tenant"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Crea nuovo tenant
              </h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              {success && <p className="mb-3 text-sm text-emerald-600">{success}</p>}
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
                <input
                  className="rounded-md border px-3 py-2 bg-background sm:col-span-2"
                  placeholder="Nome tenant"
                  value={form.tenantName}
                  onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
                  required
                />
                <input
                  className="rounded-md border px-3 py-2 bg-background"
                  placeholder="Nome admin"
                  value={form.adminFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, adminFirstName: e.target.value }))}
                  required
                />
                <input
                  className="rounded-md border px-3 py-2 bg-background"
                  placeholder="Cognome admin"
                  value={form.adminLastName}
                  onChange={(e) => setForm((f) => ({ ...f, adminLastName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="rounded-md border px-3 py-2 bg-background sm:col-span-2"
                  placeholder="Email admin"
                  value={form.adminEmail}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="rounded-md border px-3 py-2 bg-background"
                  placeholder="Password admin"
                  value={form.adminPassword}
                  onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                  required
                />
                <input
                  className="rounded-md border px-3 py-2 bg-background"
                  placeholder="Dipartimento iniziale"
                  value={form.departmentName}
                  onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
                />
                <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={saving}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Creazione in corso...' : 'Crea tenant + admin'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

