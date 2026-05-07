'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

type DepartmentsFilterProps = {
  onFilterChange: (searchTerm: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  sortBy: 'name' | 'id';
  onSortChange: (sort: 'name' | 'id') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
};

export function DepartmentsFilter({
  onFilterChange,
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
  }, [searchTerm, onFilterChange]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end w-full">
      <Input
        type="text"
        placeholder="Cerca per nome..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-9 text-sm"
      />

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'name' | 'id')}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm whitespace-nowrap"
      >
        <option value="name">Ordina per nome</option>
        <option value="id">Ordina per ID</option>
      </select>

      <select
        value={sortOrder}
        onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm whitespace-nowrap"
      >
        <option value="asc">Crescente</option>
        <option value="desc">Decrescente</option>
      </select>

      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm whitespace-nowrap"
      >
        <option value={10}>10</option>
        <option value={15}>15</option>
        <option value={30}>30</option>
      </select>
    </div>
  );
}
