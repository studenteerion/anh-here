'use client';

import { useEffect, useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, RefreshCw, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { EmployeeTableRow } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function EmployeeList({
  onAddEmployee,
  onRefreshed,
  staticData,
}: {
  onAddEmployee?: () => void;
  onRefreshed?: () => void;
  staticData?: EmployeeTableRow[];
}) {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const isStatic = staticData !== undefined;
  const [employees, setEmployees] = useState<EmployeeTableRow[]>(staticData || []);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState<number | null>(staticData?.length || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'first_name' | 'last_name' | 'id'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeTableRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPage = async (p = page, isRefresh = false) => {
    // If using static data, don't fetch
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

      const res = await authFetch(`/api/employees?${params.toString()}`);
      const json = await res.json();

      if (json.status === 'success') {
        const data = json.data;
        setEmployees(data.employees || []);
        if (data.pagination) setTotal(data.pagination.total);
        else setTotal(data.employees?.length || 0);
        setPage(data.pagination?.page || 1);
        // notify parent only on explicit refresh actions (avoid unnecessary rerenders while typing)
        if (isRefresh) {
          try {
            onRefreshed?.();
          } catch (err) {
            console.error('onRefreshed callback error', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
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
  const statusBadgeClass = (status: EmployeeTableRow['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'inactive'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  const totalPages = total ? Math.ceil(total / limit) : 0;
  const hasPrevPage = page > 1;
  const hasNextPage = total !== null ? page * limit < total : false;
  const isAlphabeticalSort = sortBy === 'first_name' || sortBy === 'last_name';

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setDeleting(true);
    try {
      const res = await authFetch(`/api/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante eliminazione dipendente');
      }

      setEmployeeToDelete(null);
      await fetchPage(page, true);
    } catch (error) {
      console.error('Errore eliminazione dipendente:', error);
    } finally {
      setDeleting(false);
    }
  };

  const renderFiltersSection = (position: 'top' | 'bottom') => (
    <div className={`${position === 'top' ? 'border-b p-4 sm:p-6 space-y-4' : 'border-t p-4 sm:p-6 space-y-4'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cerca (nome, cognome, ID)"
          className="lg:col-span-2"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'created_at' | 'first_name' | 'last_name' | 'id')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="created_at">Ordina per: data creazione</option>
          <option value="first_name">Ordina per: nome</option>
          <option value="last_name">Ordina per: cognome</option>
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
          <span className="hidden sm:inline"> ({total ?? 0} dipendenti totali)</span>
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
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-semibold">Elenco dipendenti</h2>
          </div>

          <div className="flex items-center gap-2">
            {onAddEmployee && (
              <Button size="sm" onClick={onAddEmployee}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuovo dipendente
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
        <table className="w-full min-w-[780px] table-fixed text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="w-1/12">ID</th>
              <th className="w-2/12">Nome</th>
              <th className="w-2/12">Cognome</th>
              <th className="w-2/12 hidden md:table-cell">Ruolo</th>
              <th className="w-2/12 hidden md:table-cell">Dipartimento</th>
              <th className="w-2/12">Status</th>
              <th className="w-2/12 hidden sm:table-cell">Creato</th>
              <th className="w-1/12 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-4 text-muted-foreground">Caricamento...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={8} className="py-4 text-muted-foreground">Nessun dipendente trovato</td></tr>
            ) : employees.map((e) => (
              <tr
                key={e.id}
                className="border-t hover:bg-muted/40 cursor-pointer"
                onClick={() => router.push(`/dashboard/employees/${e.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/dashboard/employees/${e.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Apri dettaglio dipendente ${e.first_name} ${e.last_name}`}
              >
                <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">#{e.id}</td>
                <td className="py-2.5 pr-2 font-medium truncate">{e.first_name}</td>
                <td className="py-2.5 pr-2 truncate">{e.last_name}</td>
                <td className="hidden md:table-cell">{e.role_name || '-'}</td>
                <td className="hidden md:table-cell">{e.department_name || '-'}</td>
                <td>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(e.status)}`}>
                    {e.status === 'active' ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td className="hidden sm:table-cell">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="text-right" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Apri menu azioni per ${e.first_name} ${e.last_name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${e.id}`)}>
                        Vedi più informazioni
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${e.id}`)}>
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setEmployeeToDelete(e)}
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

      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setEmployeeToDelete(null)}
            aria-label="Chiudi conferma eliminazione"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Conferma eliminazione</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sei sicuro di voler eliminare questo impiegato?
            </p>
            <div className="rounded-md border p-3 text-sm space-y-1 mb-4">
              <p><span className="text-muted-foreground">ID:</span> #{employeeToDelete.id}</p>
              <p><span className="text-muted-foreground">Nome:</span> {employeeToDelete.first_name} {employeeToDelete.last_name}</p>
              <p><span className="text-muted-foreground">Ruolo:</span> {employeeToDelete.role_name || '-'}</p>
              <p><span className="text-muted-foreground">Dipartimento:</span> {employeeToDelete.department_name || '-'}</p>
              <p><span className="text-muted-foreground">Stato:</span> {employeeToDelete.status === 'active' ? 'Attivo' : 'Inattivo'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmployeeToDelete(null)} disabled={deleting}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={handleDeleteEmployee} disabled={deleting}>
                {deleting ? 'Eliminazione...' : 'Conferma elimina'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
