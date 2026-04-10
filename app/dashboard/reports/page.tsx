'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CompanyReport = {
  id: number;
  employeeId: number;
  link: string;
  createdAt: string;
};

export default function ReportsPage() {
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<CompanyReport[]>([]);
  const [allItems, setAllItems] = useState<CompanyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLink, setNewLink] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const reportsThisMonth = useMemo(() => {
    const now = new Date();
    return allItems.filter((report) => {
      const d = new Date(report.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [allItems]);

  const latestReportDate = useMemo(() => {
    if (allItems.length === 0) return null;
    return allItems[0]?.createdAt || null;
  }, [allItems]);

  const fetchReports = async (targetPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [listRes, allRes] = await Promise.all([
        authFetch(`/api/company-reports?page=${targetPage}&limit=${limit}`),
        authFetch('/api/company-reports'),
      ]);
      const [listJson, allJson] = await Promise.all([listRes.json(), allRes.json()]);

      if (listJson.status !== 'success') {
        throw new Error(listJson.message || 'Errore caricamento report');
      }

      setItems(listJson.data.reports || []);
      setTotal(listJson.data.pagination?.total || (listJson.data.reports?.length ?? 0));
      setPage(listJson.data.pagination?.page || 1);

      if (allJson.status === 'success') {
        setAllItems(allJson.data.reports || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante il caricamento report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const handleCreateReport = async () => {
    if (!newLink.trim()) return;
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch('/api/company-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: newLink.trim() }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore creazione report');
      }

      setSuccess('Report creato con successo');
      setNewLink('');
      await fetchReports(1, true);
    } catch (err: any) {
      setError(err?.message || 'Errore creazione report');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border rounded-lg bg-card p-4"><p className="text-xs text-muted-foreground">Totale report</p><p className="text-2xl font-semibold">{allItems.length}</p></div>
        <div className="border rounded-lg bg-card p-4"><p className="text-xs text-muted-foreground">Report questo mese</p><p className="text-2xl font-semibold">{reportsThisMonth}</p></div>
        <div className="border rounded-lg bg-card p-4"><p className="text-xs text-muted-foreground">Ultimo report</p><p className="text-sm font-medium">{latestReportDate ? new Date(latestReportDate).toLocaleDateString('it-IT') : '-'}</p></div>
      </div>

      <div className="border rounded-lg bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Report</h1>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Link report (URL)" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
          <Button onClick={handleCreateReport} disabled={creating || !newLink.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creazione...' : 'Aggiungi'}
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">Totale risultati: {total}</div>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => fetchReports(page, true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Link</th>
                <th className="py-2">Creato</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-4 text-muted-foreground">Caricamento...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-muted-foreground">Nessun report trovato</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">#{item.id}</td>
                  <td className="py-2 pr-2">
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                      {item.link}
                    </a>
                  </td>
                  <td className="py-2">{new Date(item.createdAt).toLocaleDateString('it-IT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">Pagina {page} di {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchReports(page - 1)} disabled={page <= 1}>Precedente</Button>
            <Button variant="outline" size="sm" onClick={() => fetchReports(page + 1)} disabled={page >= totalPages}>Successiva</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
