'use client';

import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type DepartmentsFilterProps = {
  onFilterChange: (searchTerm: string) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
  refreshing: boolean;
  limit: number;
  onLimitChange: (limit: number) => void;
  sortBy: 'name' | 'id';
  onSortChange: (sort: 'name' | 'id') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
};

export function DepartmentsFilter({
  onFilterChange,
  onRefresh,
  onCreateClick,
  refreshing,
  limit,
  onLimitChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: DepartmentsFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onFilterChange(searchTerm);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-10 pr-3 rounded-md border border-input bg-background text-sm"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'name' | 'id')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="name">Ordina per nome</option>
          <option value="id">Ordina per ID</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={30}>30</option>
        </select>

        <Button size="sm" onClick={onCreateClick} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo
        </Button>

        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="whitespace-nowrap">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>
    </div>
  );
}
