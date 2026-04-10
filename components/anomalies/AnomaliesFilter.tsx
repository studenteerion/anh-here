'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type AnomaliesFilterProps = {
  onFilterChange: (searchTerm: string, statusFilter: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  statusFilter: 'all' | 'open' | 'in_progress' | 'closed';
  onStatusChange: (status: 'all' | 'open' | 'in_progress' | 'closed') => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  sortBy: 'id' | 'date';
  onSortChange: (sort: 'id' | 'date') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
};

export function AnomaliesFilter({
  onFilterChange,
  onRefresh,
  refreshing,
  statusFilter,
  onStatusChange,
  limit,
  onLimitChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: AnomaliesFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onFilterChange(searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca descrizione..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-10 pr-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as any)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="all">Tutti gli stati</option>
        <option value="open">Aperte</option>
        <option value="in_progress">In lavorazione</option>
        <option value="closed">Chiuse</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'id' | 'date')}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="id">Ordina per ID</option>
        <option value="date">Ordina per data</option>
      </select>

      <select
        value={sortOrder}
        onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="asc">Crescente</option>
        <option value="desc">Decrescente</option>
      </select>

      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value={10}>10</option>
        <option value={15}>15</option>
        <option value={20}>20</option>
        <option value={30}>30</option>
      </select>

      <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Aggiorna
      </Button>
    </div>
  );
}
