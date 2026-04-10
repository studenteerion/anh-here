'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, RefreshCw, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import type { AttendanceHistoryData, AttendancePeriod } from '@/types/attendanceHistory';

interface AttendanceHistoryTableProps {
  defaultPeriod?: AttendancePeriod;
  defaultLimit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  employeeId?: number;
  withBorder?: boolean;
}

export function AttendanceHistoryTable({ 
  defaultPeriod = 'month',
  defaultLimit = 15,
  autoRefresh = true,
  refreshInterval = 60000,
  employeeId,
  withBorder = true,
}: AttendanceHistoryTableProps) {
  const [data, setData] = useState<AttendanceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState<AttendancePeriod>(defaultPeriod);
  const [limit, setLimit] = useState(defaultLimit);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomFrom, setAppliedCustomFrom] = useState<string | undefined>(undefined);
  const [appliedCustomTo, setAppliedCustomTo] = useState<string | undefined>(undefined);
  const authFetch = useAuthFetch();

  const fetchHistory = async (page: number, selectedPeriod: AttendancePeriod, selectedLimit: number, from?: string, to?: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      
      // SEMPRE aggiungi page e limit per la paginazione
      params.append('page', page.toString());
      params.append('limit', selectedLimit.toString());
      if (employeeId) {
        params.append('employeeId', employeeId.toString());
      }
      
      // Periodo
      if (selectedPeriod === 'custom' && from && to) {
        params.append('period', 'custom');
        params.append('from', from);
        params.append('to', to);
      } else if (selectedPeriod === 'all') {
        // "all" = tutto l'anno corrente
        const now = new Date();
        const yearStart = `${now.getFullYear()}-01-01`;
        const yearEnd = `${now.getFullYear()}-12-31`;
        params.append('period', 'custom');
        params.append('from', yearStart);
        params.append('to', yearEnd);
      } else {
        params.append('period', selectedPeriod);
      }

      const url = `/api/attendances/history?${params.toString()}`;
      console.log('🚀 FRONTEND REQUEST:', { url, page, limit: selectedLimit, period: selectedPeriod });

      const response = await authFetch(url);
      const result = await response.json();

      if (result.status === 'success') {
        console.log('📥 FRONTEND RECEIVED:', {
          historyLength: result.data.history?.length,
          totalDays: result.data.totalDays,
          hasPagination: !!result.data.pagination,
          pagination: result.data.pagination
        });
        setData(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dello storico:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Expose global refresh function (uses applied range)
  useEffect(() => {
    (window as typeof window & { __refreshAttendanceHistory?: () => void }).__refreshAttendanceHistory = () => {
      fetchHistory(currentPage, period, limit, appliedCustomFrom, appliedCustomTo, true);
    };
    
    return () => {
      delete (window as typeof window & { __refreshAttendanceHistory?: () => void }).__refreshAttendanceHistory;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, period, limit, appliedCustomFrom, appliedCustomTo, employeeId]);

  // Initial fetch (and whenever page/period/limit/applied custom range change)
  useEffect(() => {
    // If period is custom, only fetch when an applied range exists
    if (period === 'custom') {
      if (appliedCustomFrom && appliedCustomTo) {
        fetchHistory(currentPage, period, limit, appliedCustomFrom, appliedCustomTo);
      }
    } else {
      // Non-custom periods fetch immediately
      fetchHistory(currentPage, period, limit, appliedCustomFrom, appliedCustomTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, period, limit, appliedCustomFrom, appliedCustomTo, employeeId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchHistory(currentPage, period, limit, appliedCustomFrom, appliedCustomTo, true);
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, currentPage, period, limit, appliedCustomFrom, appliedCustomTo, employeeId]);
  // Note: keep dependency list consistent with fetch trigger variables

  const handlePeriodChange = (newPeriod: AttendancePeriod) => {
    setPeriod(newPeriod);
    setCurrentPage(1);
    if (newPeriod !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
      setAppliedCustomFrom(undefined);
      setAppliedCustomTo(undefined);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleManualRefresh = () => {
    fetchHistory(currentPage, period, limit, customFrom, customTo, true);
  };

  const handleCustomDateApply = () => {
    if (customFrom && customTo) {
      setCurrentPage(1);
      // Apply the selected range (updates appliedCustomFrom/appliedCustomTo which triggers fetch)
      setAppliedCustomFrom(customFrom);
      setAppliedCustomTo(customTo);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Componente Filtri riutilizzabile
  const FiltersSection = ({ position }: { position: 'top' | 'bottom' }) => (
    <div className={`p-4 sm:p-6 ${position === 'top' ? 'border-b' : 'border-t'} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className={`text-xl sm:text-2xl font-semibold ${position === 'bottom' ? 'hidden sm:block' : ''}`}>
          Storico Presenze
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>
      
      {/* Period Selector */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          {(['today', 'week', 'month', 'all'] as AttendancePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all border whitespace-nowrap ${
                period === p
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-input hover:bg-accent'
              }`}
            >
              {p === 'today' && 'Oggi'}
              {p === 'week' && 'Settimana'}
              {p === 'month' && 'Mese'}
              {p === 'all' && 'Tutto'}
            </button>
          ))}
          <button
            onClick={() => handlePeriodChange('custom')}
            className={`col-span-2 sm:col-span-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all border whitespace-nowrap ${
              period === 'custom'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            Personalizzato
          </button>
        </div>

        {/* Custom Date Range - Input nativi */}
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="w-full">
              <label className="text-xs text-muted-foreground mb-1 block">Da:</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full text-sm"
              />
            </div>
            <div className="w-full">
              <label className="text-xs text-muted-foreground mb-1 block">A:</label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                className="w-full text-sm"
              />
            </div>
            <div className="w-full flex items-end">
              <Button
                onClick={handleCustomDateApply}
                disabled={!customFrom || !customTo}
                size="sm"
                className="w-full"
              >
                Applica
              </Button>
            </div>
          </div>
        )}
      </div>

  {/* Items per page - mostrato anche per 'all' così da permettere paginazione */}
  {
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Elementi:
            </span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          {/* count display intentionally removed per UX request */}
        </div>
  }
    </div>
  );

  // Componente Paginazione riutilizzabile
  const PaginationSection = ({ position }: { position: 'top' | 'bottom' }) => {
    if (!data?.pagination || data.pagination.totalPages <= 1) return null;

    return (
      <div className={`px-3 sm:px-6 py-4 ${position === 'top' ? 'border-b' : 'border-t'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Pagina {data.pagination.page} di {data.pagination.totalPages}
          <span className="hidden sm:inline"> ({data.pagination.total} timbrature totali)</span>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={!data.pagination.hasPrevPage}
            className="flex-shrink-0"
            title="Prima pagina"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!data.pagination.hasPrevPage}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Precedente</span>
          </Button>
          
          {/* Page numbers - desktop only */}
          <div className="hidden md:flex gap-1">
            {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              const total = data.pagination!.totalPages;
              const current = data.pagination!.page;
              
              if (total <= 5) {
                pageNum = i + 1;
              } else if (current <= 3) {
                pageNum = i + 1;
              } else if (current >= total - 2) {
                pageNum = total - 4 + i;
              } else {
                pageNum = current - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === current ? 'default' : 'outline'}
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
            onClick={() => goToPage(currentPage + 1)}
            disabled={!data.pagination.hasNextPage}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Successiva</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(data.pagination!.totalPages)}
            disabled={!data.pagination.hasNextPage}
            className="flex-shrink-0"
            title="Ultima pagina"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-6 bg-card ${withBorder ? 'border rounded-lg' : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card ${withBorder ? 'border rounded-lg' : ''}`}>
      {/* Filtri in alto */}
      <FiltersSection position="top" />
      
      {/* Paginazione in alto */}
      <PaginationSection position="top" />

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entrata
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Uscita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ore Lavorate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.history && data.history.length > 0 ? (
              data.history.flatMap((day) => 
                day.attendances.map((attendance) => (
                  <tr key={`${day.date}-${attendance.id}`} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatTime(attendance.checkin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatTime(attendance.checkout)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatHours(attendance.hours)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.checkout ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                          Completato
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                          In corso
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                  Nessuna timbratura trovata per questo periodo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Table - Scrollabile orizzontalmente */}
      <div className="md:hidden overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Data
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Entrata
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Uscita
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Ore
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.history && data.history.length > 0 ? (
              data.history.flatMap((day) =>
                day.attendances.map((attendance) => (
                  <tr key={`${day.date}-${attendance.id}`} className="hover:bg-muted/30">
                    <td className="px-3 py-3 text-xs font-medium truncate max-w-[90px]">
                      {new Date(day.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 text-xs truncate max-w-[80px]">
                      {formatTime(attendance.checkin)}
                    </td>
                    <td className="px-3 py-3 text-xs truncate max-w-[80px]">
                      {formatTime(attendance.checkout)}
                    </td>
                    <td className="px-3 py-3 text-xs truncate max-w-[70px]">
                      {formatHours(attendance.hours)}
                    </td>
                    <td className="px-3 py-3">
                      {attendance.checkout ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                          <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-xs">
                  Nessuna timbratura trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginazione in basso */}
      <PaginationSection position="bottom" />
      
      {/* Filtri in basso */}
      <FiltersSection position="bottom" />
    </div>
  );
}
