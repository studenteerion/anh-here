'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { ReportCreateForm } from '@/components/reports/ReportCreateForm';
import { ReportsFilter } from '@/components/reports/ReportsFilter';

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Filtra elementi client-side in base alla ricerca
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      item.link.toLowerCase().includes(term) ||
      item.id.toString().includes(term) ||
      item.employeeId.toString().includes(term)
    );
  }, [items, searchTerm]);

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

  const onReportCreated = () => {
    setShowCreateModal(false);
    fetchReports(1, true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-semibold">Elenco report</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b">
          <ReportsFilter
            onFilterChange={setSearchTerm}
            onRefresh={() => fetchReports(page, true)}
            onCreateClick={() => setShowCreateModal(true)}
            refreshing={refreshing}
            limit={limit}
            onLimitChange={(newLimit) => setLimit(newLimit)}
          />
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
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-muted-foreground">Nessun report trovato</td></tr>
              ) : filteredItems.map((item) => (
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
          <span className="text-xs sm:text-sm text-muted-foreground">Totale report: {total}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Pagina {page} di {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => fetchReports(page - 1)} disabled={page <= 1}>Precedente</Button>
            <Button variant="outline" size="sm" onClick={() => fetchReports(page + 1)} disabled={page >= totalPages}>Successiva</Button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-lg sm:text-xl font-semibold">Crea nuovo report</h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <ReportCreateForm onCreated={onReportCreated} embedded />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
