'use client';

import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, X, Plus, User, Settings, History, MoreVertical, Trash2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { PaginationSection } from '@/components/ui/pagination-section';
import { AnomaliesFilter } from '@/components/anomalies/AnomaliesFilter';
import { AnomalyCreateForm } from '@/components/anomalies/AnomalyCreateForm';
import type { AnomalyListItem } from '@/types';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function AnomaliesPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<AnomalyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'admin'>('personal');
  const [hasAdminPermission, setHasAdminPermission] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<number | null>(null);
  const [closeNotes, setCloseNotes] = useState('');

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
      if (viewMode === 'admin') params.append('employeeId', 'all');

      const listRes = await authFetch(`/api/anomalies?${params.toString()}`);
      const listJson = await listRes.json();

      if (listJson.status !== 'success') {
        throw new Error(listJson.message || 'Errore caricamento anomalie');
      }

      setItems(listJson.data.anomalies || []);
      setTotal(listJson.data.pagination?.total || (listJson.data.anomalies?.length ?? 0));
      setPage(listJson.data.pagination?.page || 1);

    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Errore durante il caricamento anomalie'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch('/api/permissions');
        const json = await res.json();
        if (json.status === 'success') {
          const permissionCodes = json.data.permissions?.map((p: any) => p.permission_code) ?? [];
          setHasAdminPermission(permissionCodes.includes('anomalies_view_all'));
        }
      } catch (err) {
        console.error('Failed to check admin permission', err);
      }
    };
    load();
  }, [authFetch]);

  useEffect(() => {
    fetchAnomalies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, limit, viewMode]);

  const statusBadgeClass = (status: AnomalyListItem['status']) =>
    status === 'closed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'in_progress'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusLabel = (status: AnomalyListItem['status']) =>
    status === 'closed' ? 'Chiusa' : status === 'in_progress' ? 'In lavorazione' : 'Aperta';

  const handleCloseAnomaly = async (anomalyId: number) => {
    try {
      const res = await authFetch(`/api/anomalies/${anomalyId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'closed',
          resolutionNotes: closeNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowCloseConfirm(null);
        setCloseNotes('');
        await fetchAnomalies(page);
      } else {
        setError(json.message || 'Failed to close anomaly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error closing anomaly');
    }
  };

  const handleDeleteAnomaly = async (anomalyId: number) => {
    try {
      const res = await authFetch(`/api/anomalies/${anomalyId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowDeleteConfirm(null);
        await fetchAnomalies(page);
      } else {
        setError(json.message || 'Failed to delete anomaly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting anomaly');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg sm:text-xl font-semibold">Anomalie</h1>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'admin' && (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova anomalia
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchAnomalies(page, true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {hasAdminPermission ? (
          <>
            <Tabs
              defaultValue={viewMode}
              onValueChange={(value) => {
                setViewMode(value as 'personal' | 'admin');
                setPage(1);
              }}
              className="w-full"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-card">
                <TabsTrigger value="personal" icon={<User className="h-4 w-4" />}>
                  Personale
                </TabsTrigger>
                <TabsTrigger value="admin" icon={<Settings className="h-4 w-4" />}>
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="border-0 p-0">
                <div className="p-4 sm:p-6 border-b">
                  <AnomaliesFilter
                    onFilterChange={(search) => setSearchTerm(search)}
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
                      <tr className="text-left text-muted-foreground border-b bg-muted/40">
                        <th className="py-3 px-3 font-semibold">ID</th>
                        <th className="py-3 px-3 font-semibold">Descrizione</th>
                        <th className="py-3 px-3 font-semibold">Segnalata da</th>
                        <th className="py-3 px-3 font-semibold">Stato</th>
                        <th className="py-3 px-3 font-semibold">Segnalata</th>
                        <th className="py-3 px-3 font-semibold">Note</th>
                        <th className="py-3 px-3 font-semibold text-center">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
                      ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nessuna anomalia trovata</td></tr>
                      ) : filteredItems.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{item.id}</td>
                          <td className="py-3 px-3 max-w-xs truncate">{item.description}</td>
                          <td className="py-3 px-3 text-sm">{item.reporterName ? `${item.reporterName}` : (item.reporterId ? `#${item.reporterId}` : '-')}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">{new Date(item.reportedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 max-w-xs truncate text-xs">{item.resolutionNotes || '-'}</td>
                          <td className="py-3 px-3">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                className="p-1 hover:bg-muted rounded transition-colors mx-auto block"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                              {openMenuId === item.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-popover border rounded-lg shadow-lg z-10">
                                  {item.status !== 'closed' && (
                                    <button
                                      onClick={() => setShowCloseConfirm(item.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Chiudi
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationSection
                  currentPage={page}
                  totalPages={totalPages}
                  total={total}
                  hasPrevPage={page > 1}
                  hasNextPage={page < totalPages}
                  onPageChange={(newPage) => fetchAnomalies(newPage)}
                  position="bottom"
                  label="anomalie"
                />
              </TabsContent>

              <TabsContent value="admin" className="border-0 p-0">
                <div className="p-4 sm:p-6 border-b">
                  <AnomaliesFilter
                    onFilterChange={(search) => setSearchTerm(search)}
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
                      <tr className="text-left text-muted-foreground border-b bg-muted/40">
                        <th className="py-3 px-3 font-semibold">ID</th>
                        <th className="py-3 px-3 font-semibold">Descrizione</th>
                        <th className="py-3 px-3 font-semibold">Segnalata da</th>
                        <th className="py-3 px-3 font-semibold">Rivolta a</th>
                        <th className="py-3 px-3 font-semibold">Stato</th>
                        <th className="py-3 px-3 font-semibold">Segnalata</th>
                        <th className="py-3 px-3 font-semibold">Risolta da</th>
                        <th className="py-3 px-3 font-semibold">Risolta il</th>
                        <th className="py-3 px-3 font-semibold">Note</th>
                        <th className="py-3 px-3 font-semibold text-center">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
                      ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Nessuna anomalia trovata</td></tr>
                      ) : filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{item.id}</td>
                          <td className="py-3 px-3 max-w-xs truncate">{item.description}</td>
                          <td className="py-3 px-3 text-sm">{item.reporterName ? `${item.reporterName}` : (item.reporterId ? `#${item.reporterId}` : '-')}</td>
                          <td className="py-3 px-3 text-sm">{item.assignedEmployeeName ? `${item.assignedEmployeeName}` : (item.assignedEmployeeId ? `#${item.assignedEmployeeId}` : '-')}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">{new Date(item.reportedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-sm">{item.resolverName ? `${item.resolverName}` : (item.resolverId ? `#${item.resolverId}` : '-')}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">{item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-3 max-w-xs truncate text-xs">{item.resolutionNotes || '-'}</td>
                          <td className="py-3 px-3">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                className="p-1 hover:bg-muted rounded transition-colors mx-auto block"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                              {openMenuId === item.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-popover border rounded-lg shadow-lg z-10">
                                  {item.status !== 'closed' && (
                                    <button
                                      onClick={() => setShowCloseConfirm(item.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-b"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Chiudi
                                    </button>
                                  )}
                                  {hasAdminPermission && (
                                    <button
                                      onClick={() => setShowDeleteConfirm(item.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Elimina
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationSection
                  currentPage={page}
                  totalPages={totalPages}
                  total={total}
                  hasPrevPage={page > 1}
                  hasNextPage={page < totalPages}
                  onPageChange={(newPage) => fetchAnomalies(newPage)}
                  position="bottom"
                  label="anomalie"
                />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <div className="p-4 sm:p-6 border-b">
              <AnomaliesFilter
                onFilterChange={(search) => setSearchTerm(search)}
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
                  <tr className="text-left text-muted-foreground border-b bg-muted/40">
                    <th className="py-3 px-3 font-semibold">ID</th>
                    <th className="py-3 px-3 font-semibold">Descrizione</th>
                    <th className="py-3 px-3 font-semibold">Segnalata da</th>
                    <th className="py-3 px-3 font-semibold">Stato</th>
                    <th className="py-3 px-3 font-semibold">Segnalata</th>
                    <th className="py-3 px-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nessuna anomalia trovata</td></tr>
                  ) : filteredItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{item.id}</td>
                      <td className="py-3 px-3 max-w-xs truncate">{item.description}</td>
                      <td className="py-3 px-3 text-sm">{item.reporterName ? `${item.reporterName}` : (item.reporterId ? `#${item.reporterId}` : '-')}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">{new Date(item.reportedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3 max-w-xs truncate text-xs">{item.resolutionNotes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationSection
              currentPage={page}
              totalPages={totalPages}
              total={total}
              hasPrevPage={page > 1}
              hasNextPage={page < totalPages}
              onPageChange={(newPage) => fetchAnomalies(newPage)}
              position="bottom"
              label="anomalie"
            />
          </>
        )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full space-y-4 border">
            <h3 className="text-lg font-semibold">Elimina anomalia?</h3>
            <p className="text-sm text-muted-foreground">Questa azione non può essere annullata. L'anomalia verrà eliminata permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteAnomaly(showDeleteConfirm)}>
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full space-y-4 border">
            <h3 className="text-lg font-semibold">Chiudi anomalia?</h3>
            <p className="text-sm text-muted-foreground">L'anomalia verrà contrassegnata come chiusa.</p>
            <div>
              <label htmlFor="close-notes" className="text-xs font-semibold text-muted-foreground uppercase">
                Note di risoluzione (opzionale)
              </label>
              <textarea
                id="close-notes"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Aggiungi note sulla risoluzione..."
                className="w-full mt-2 p-2 border rounded-lg text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setShowCloseConfirm(null);
                setCloseNotes('');
              }}>
                Annulla
              </Button>
              <Button onClick={() => handleCloseAnomaly(showCloseConfirm)}>
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
