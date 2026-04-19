'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  RefreshCw,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TenantTableRow, TenantListProps } from '@/types/tenants';

export default function TenantList({
  onAddTenant,
  onRefreshed,
  onTenantDeleted,
  staticData,
}: TenantListProps) {
  const isStatic = staticData !== undefined;
  const [tenants, setTenants] = useState<TenantTableRow[]>(staticData || []);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState<number | null>(staticData?.length || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'id'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [tenantToDelete, setTenantToDelete] = useState<TenantTableRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPage = async (p = page, isRefresh = false) => {
    if (isStatic) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('page', p.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/platform/tenants?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (res.ok && json.data) {
        const data = json.data;
        setTenants(data.tenants || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setPage(data.pagination.page || 1);
        } else {
          setTotal(data.tenants?.length || 0);
        }

        if (isRefresh) {
          try {
            onRefreshed?.();
          } catch (err) {
            console.error('onRefreshed callback error', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, statusFilter, searchTerm, sortBy, sortOrder]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1) return;
    if (totalPages && nextPage > totalPages) return;
    fetchPage(nextPage);
  };

  const statusBadgeClass = (status: TenantTableRow['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const totalPages = total ? Math.ceil(total / limit) : 0;
  const hasPrevPage = page > 1;
  const hasNextPage = total !== null ? page * limit < total : false;
  const isAlphabeticalSort = sortBy === 'name';

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Errore durante eliminazione tenant');
      }

      setTenantToDelete(null);
      onTenantDeleted?.();
      await fetchPage(page, true);
    } catch (error) {
      console.error('Errore eliminazione tenant:', error);
    } finally {
      setDeleting(false);
    }
  };

  const renderFiltersSection = (position: 'top' | 'bottom') => (
    <div className={`${position === 'top' ? 'border-b p-4 sm:p-6 space-y-4' : 'border-t p-4 sm:p-6 space-y-4'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cerca (nome, ID)"
          className="lg:col-span-2"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name' | 'id')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="created_at">Ordina per: data creazione</option>
          <option value="name">Ordina per: nome</option>
          <option value="id">Ordina per: ID</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {isAlphabeticalSort ? (
            <>
              <option value="asc">Ordine alfabetico: A → Z</option>
              <option value="desc">Ordine alfabetico: Z → A</option>
            </>
          ) : (
            <>
              <option value="desc">Direzione: decrescente</option>
              <option value="asc">Direzione: crescente</option>
            </>
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Tutti gli stati</option>
          <option value="active">Solo attivi</option>
          <option value="inactive">Solo inattivi</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {total !== null ? `Totale risultati: ${total}` : 'Totale risultati: --'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">Elementi:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaginationSection = (position: 'top' | 'bottom') => {
    if (!totalPages || totalPages <= 1) return null;

    return (
      <div className={`px-3 sm:px-6 py-4 ${position === 'top' ? 'border-b' : 'border-t'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Pagina {page} di {totalPages}
          <span className="hidden sm:inline"> ({total ?? 0} tenant totali)</span>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={!hasPrevPage}
            className="flex-shrink-0"
            title="Prima pagina"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={!hasPrevPage}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Precedente</span>
          </Button>

          <div className="hidden md:flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-9 h-9 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={!hasNextPage}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Successiva</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(totalPages)}
            disabled={!hasNextPage}
            className="flex-shrink-0"
            title="Ultima pagina"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 sm:p-6 border-b space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-semibold">Elenco tenant</h2>
          </div>

          <div className="flex items-center gap-2">
            {onAddTenant && (
              <Button size="sm" onClick={onAddTenant}>
                <Building2 className="h-4 w-4 mr-2" />
                Nuovo tenant
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchPage(page, true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>
      </div>

      {renderFiltersSection('top')}
      {renderPaginationSection('top')}

      <div className="overflow-x-auto p-4 sm:p-6 pt-4">
        <table className="w-full min-w-[600px] table-fixed text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="w-1/12">ID</th>
              <th className="w-5/12">Nome</th>
              <th className="w-3/12">Status</th>
              <th className="w-2/12 hidden sm:table-cell">Creato</th>
              <th className="w-1/12 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-4 text-muted-foreground">Caricamento...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-muted-foreground">Nessun tenant trovato</td></tr>
            ) : tenants.map((t) => (
              <tr
                key={t.id}
                className="border-t hover:bg-muted/40"
              >
                <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">#{t.id}</td>
                <td className="py-2.5 pr-2 font-medium truncate">{t.name}</td>
                <td>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(t.status)}`}>
                    {t.status === 'active' ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td className="hidden sm:table-cell">{new Date(t.created_at).toLocaleDateString('it-IT')}</td>
                <td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Apri menu azioni per ${t.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setTenantToDelete(t)}
                      >
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderPaginationSection('bottom')}
      {renderFiltersSection('bottom')}

      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setTenantToDelete(null)}
            aria-label="Chiudi conferma eliminazione"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Conferma eliminazione</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sei sicuro di voler eliminare questo tenant?
            </p>
            <div className="rounded-md border p-3 text-sm space-y-1 mb-4">
              <p><span className="text-muted-foreground">ID:</span> #{tenantToDelete.id}</p>
              <p><span className="text-muted-foreground">Nome:</span> {tenantToDelete.name}</p>
              <p><span className="text-muted-foreground">Stato:</span> {tenantToDelete.status === 'active' ? 'Attivo' : 'Inattivo'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTenantToDelete(null)} disabled={deleting}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={handleDeleteTenant} disabled={deleting}>
                {deleting ? 'Eliminazione...' : 'Conferma elimina'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
