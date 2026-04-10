'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus } from 'lucide-react';

interface ShiftsFilterProps {
  departmentFilter: 'all' | number;
  onDepartmentChange: (value: 'all' | number) => void;
  departments: { id: number; department_name: string }[];
  limit: number;
  onLimitChange: (value: number) => void;
  departmentFilterActive: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'name' | 'start_time';
  onSortChange: (value: 'name' | 'start_time') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  total: number;
  onRefresh: () => void;
  refreshing: boolean;
  onAdd?: () => void;
}

export function ShiftsFilter({
  departmentFilter,
  onDepartmentChange,
  departments,
  limit,
  onLimitChange,
  departmentFilterActive,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  total,
  onRefresh,
  refreshing,
  onAdd,
}: ShiftsFilterProps) {
  return (
    <div className="p-4 sm:p-6 border-b space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground">Totale turni: {total}</div>
        <div className="flex flex-wrap items-center gap-2">
          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo turno
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
            type="text"
            placeholder="Cerca per nome turno..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 text-sm"
        />

        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">Tutti i dipartimenti</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.department_name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'name' | 'start_time')}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="name">Ordina per nome</option>
          <option value="start_time">Ordina per inizio</option>
        </select>

        <div className="flex gap-2">
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm flex-1"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>

          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={departmentFilterActive}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>
    </div>
  );
}
