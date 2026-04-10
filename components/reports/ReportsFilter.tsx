'use client';

import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type ReportsFilterProps = {
  onFilterChange: (searchTerm: string) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
  refreshing: boolean;
  limit: number;
  onLimitChange: (limit: number) => void;
};

export function ReportsFilter({
  onFilterChange,
  onRefresh,
  onCreateClick,
  refreshing,
  limit,
  onLimitChange,
}: ReportsFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    onFilterChange(searchTerm);
  }, [searchTerm]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cerca per link..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-10 pr-3 rounded-md border border-input bg-background text-sm"
        />
      </div>
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
      <Button size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4 mr-2" />
        Nuovo
      </Button>
    </div>
  );
}
