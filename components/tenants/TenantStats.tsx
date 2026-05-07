'use client';

import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { TenantTableRow } from '@/types/tenants';

interface StatsCardProps {
  title: string;
  value: number | null;
  subtitle: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

function StatsCard({ title, value, subtitle, icon, valueClassName }: StatsCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${valueClassName ?? ''}`}>{value ?? '--'}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

export default function TenantStats({ refreshKey = 0 }: { refreshKey?: number }) {
  const [total, setTotal] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [inactive, setInactive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch('/api/platform/tenants?limit=1000', {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || !json.data) return;

        const tenants: Pick<TenantTableRow, 'id' | 'status'>[] = json.data.tenants || [];
        if (!mounted) return;

        setTotal(tenants.length);
        let a = 0;
        let i = 0;
        for (const t of tenants) {
          if (t.status === 'active') a++;
          else i++;
        }
        setActive(a);
        setInactive(i);
      } catch (err) {
        console.error('Failed to load tenant stats', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="border rounded-lg bg-card p-6">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Statistiche tenant</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          title="Totale tenant"
          value={total}
          subtitle="Anagrafica complessiva"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Attivi"
          value={active}
          subtitle="Stato attivo"
          icon={<CheckCircle2 className="h-4 w-4" />}
          valueClassName="text-green-600"
        />
        <StatsCard
          title="Inattivi"
          value={inactive}
          subtitle="Stato inattivo"
          icon={<XCircle className="h-4 w-4" />}
          valueClassName="text-red-600"
        />
      </div>
    </div>
  );
}
