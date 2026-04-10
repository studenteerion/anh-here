'use client';

import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, X, Plus } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { AnomaliesFilter } from '@/components/anomalies/AnomaliesFilter';
import { AnomalyCreateForm } from '@/components/anomalies/AnomalyCreateForm';

type Anomaly = {
  id: number;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  reportedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  reporterId?: number;
  resolverId?: number;
  reporterName?: string;
  resolverName?: string;
};

export default function AnomaliesPage() {
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Filtra e ordina elementi client-side
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.description.toLowerCase().includes(term) ||
        item.id.toString().includes(term) ||
        (item.reporterName?.toLowerCase().includes(term) ?? false)
      );
    }

    result.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'id') {
        compareValue = a.id - b.id;
      } else {
        const dateA = new Date(a.reportedAt).getTime();
        const dateB = new Date(b.reportedAt).getTime();
        compareValue = dateA - dateB;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [items, searchTerm, sortBy, sortOrder]);

  const fetchAnomalies = async (targetPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', targetPage.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [listRes, openRes, progressRes, closedRes] = await Promise.all([
        authFetch(`/api/anomalies?${params.toString()}`),
        authFetch('/api/anomalies?status=open&page=1&limit=1'),
        authFetch('/api/anomalies?status=in_progress&page=1&limit=1'),
        authFetch('/api/anomalies?status=closed&page=1&limit=1'),
      ]);

      const [listJson, openJson, progressJson, closedJson] = await Promise.all([
        listRes.json(),
        openRes.json(),
        progressRes.json(),
        closedRes.json(),
      ]);

      if (listJson.status !== 'success') {
        throw new Error(listJson.message || 'Errore caricamento anomalie');
      }

      setItems(listJson.data.anomalies || []);
      setTotal(listJson.data.pagination?.total || (listJson.data.anomalies?.length ?? 0));
      setPage(listJson.data.pagination?.page || 1);

      if (openJson.status === 'success') setOpenCount(openJson.data.pagination?.total || 0);
      if (progressJson.status === 'success') setInProgressCount(progressJson.data.pagination?.total || 0);
      if (closedJson.status === 'success') setClosedCount(closedJson.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Errore durante il caricamento anomalie');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnomalies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, limit]);

  const statusBadgeClass = (status: Anomaly['status']) =>
    status === 'closed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'in_progress'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusLabel = (status: Anomaly['status']) =>
    status === 'closed' ? 'Chiusa' : status === 'in_progress' ? 'In lavorazione' : 'Aperta';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg sm:text-xl font-semibold">Anomalie</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova anomalia
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchAnomalies(page, true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b">
          <AnomaliesFilter
            onFilterChange={(search, status) => setSearchTerm(search)}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            limit={limit}
            onLimitChange={(newLimit) => setLimit(newLimit)}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>

        {error && <div className="px-4 sm:px-6 pt-4 text-sm text-red-600">{error}</div>}

        <div className="overflow-x-auto p-4 sm:p-6 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Descrizione</th>
                <th className="py-2 pr-2">Segnalata da</th>
                <th className="py-2 pr-2">Stato</th>
                <th className="py-2 pr-2">Segnalata</th>
                <th className="py-2 pr-2">Risolta da</th>
                <th className="py-2 pr-2">Risolta il</th>
                <th className="py-2">Note Risoluzione</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-4 text-muted-foreground">Caricamento...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="py-4 text-muted-foreground">Nessuna anomalia trovata</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">#{item.id}</td>
                  <td className="py-2 pr-2">{item.description}</td>
                  <td className="py-2 pr-2 text-sm">{item.reporterName ? `${item.reporterName}` : (item.reporterId ? `#${item.reporterId}` : '-')}</td>
                  <td className="py-2 pr-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                  </td>
                  <td className="py-2 pr-2 text-xs">{new Date(item.reportedAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-2 text-sm">{item.resolverName ? `${item.resolverName}` : (item.resolverId ? `#${item.resolverId}` : '-')}</td>
                  <td className="py-2 pr-2 text-xs">{item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : '-'}</td>
                  <td className="py-2 text-xs">{item.resolutionNotes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">Pagina {page} di {totalPages} ({total} anomalie)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAnomalies(page - 1)} disabled={page <= 1}>Precedente</Button>
            <Button variant="outline" size="sm" onClick={() => fetchAnomalies(page + 1)} disabled={page >= totalPages}>Successiva</Button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Chiudi popup aggiunta anomalia"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="relative z-10 w-full max-w-2xl rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Segnala anomalia
              </h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <AnomalyCreateForm 
                onCreated={() => {
                  setShowCreateModal(false);
                  fetchAnomalies(1, true);
                }}
                embedded
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
