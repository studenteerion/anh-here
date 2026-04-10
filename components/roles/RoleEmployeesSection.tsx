'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RoleEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number;
  status: 'active' | 'inactive';
  createdAt: string;
};

type RoleEmployeesSectionProps = {
  isExpanded: boolean;
  onToggleExpand: () => void;
  employees: RoleEmployee[];
  departmentNameById: Record<number, string>;
  onEmployeeClick: (id: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  limit: number;
  onLimitChange: (value: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function RoleEmployeesSection({
  isExpanded,
  onToggleExpand,
  employees,
  departmentNameById,
  onEmployeeClick,
  currentPage,
  totalPages,
  onPageChange,
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  limit,
  onLimitChange,
  hasNextPage,
  hasPrevPage,
}: RoleEmployeesSectionProps) {
  const statusBadgeClass = (status: RoleEmployee['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'inactive'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header collassabile */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 sm:px-6 py-4 border-b flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Dipendenti con questo ruolo</h2>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            {employees.length} dipendenti
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Contenuto collassabile */}
      {isExpanded && (
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain space-y-4">
          {/* Filtri e ricerca */}
          <div className="p-4 sm:p-6 border-b space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Input
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cerca (nome, cognome, ID)"
                className="lg:col-span-2"
              />

              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Solo attivi</option>
                <option value="inactive">Solo inattivi</option>
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
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Tabella */}
          <div className="overflow-x-auto p-4 sm:p-6 pt-4">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="w-1/12">ID</th>
                  <th className="w-2/12">Nome</th>
                  <th className="w-2/12">Cognome</th>
                  <th className="w-3/12">Dipartimento</th>
                  <th className="w-2/12">Status</th>
                  <th className="w-2/12">Creato</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      Nessun dipendente con questo ruolo
                    </td>
                  </tr>
                ) : (
                  employees.map((employeeItem) => (
                    <tr
                      key={employeeItem.id}
                      className="border-t hover:bg-muted/40 cursor-pointer"
                      onClick={() => onEmployeeClick(employeeItem.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onEmployeeClick(employeeItem.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Apri dettaglio dipendente ${employeeItem.firstName} ${employeeItem.lastName}`}
                    >
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">#{employeeItem.id}</td>
                      <td className="py-2.5 pr-2 font-medium truncate">{employeeItem.firstName}</td>
                      <td className="py-2.5 pr-2 truncate">{employeeItem.lastName}</td>
                      <td className="py-2.5 pr-2 truncate">
                        {departmentNameById[employeeItem.departmentId] || `Dip. #${employeeItem.departmentId}`}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(employeeItem.status)}`}>
                          {employeeItem.status === 'active' ? 'Attivo' : 'Inattivo'}
                        </span>
                      </td>
                      <td className="py-2.5">{new Date(employeeItem.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          <div className="border-t p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={!hasPrevPage}
                  className="flex-shrink-0"
                >
                  ⟨⟨
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="flex-1 sm:flex-none"
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="flex-1 sm:flex-none"
                >
                  Successiva
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={!hasNextPage}
                  className="flex-shrink-0"
                  title="Ultima pagina"
                >
                  ⟩⟩
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
