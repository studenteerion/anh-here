'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

type AnomaliesFilterProps = {
  onFilterChange: (searchTerm: string, statusFilter: string) => void;
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
  }, [searchTerm, statusFilter, onFilterChange]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end w-full">
      <div className="flex-1 relative min-w-0 lg:col-span-2">
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
        onChange={(e) => onStatusChange(e.target.value as 'all' | 'open' | 'in_progress' | 'closed')}
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
    </div>
  );
}
