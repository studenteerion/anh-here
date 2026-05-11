'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { RolePermissionView } from '@/types';

interface RolePermissionsProps {
  roleId: number;
  permissions: RolePermissionView[];
  onTogglePermission: (permissionId: number, isAllowed: boolean) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function RolePermissionsSection({
  permissions,
  onTogglePermission,
  isExpanded: isExpandedProp = false,
  onToggleExpand: onToggleExpandProp,
}: RolePermissionsProps) {
  const [localIsExpanded, setLocalIsExpanded] = useState(isExpandedProp);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Usa prop se fornita, altrimenti usa stato locale
  const isExpanded = onToggleExpandProp !== undefined ? isExpandedProp : localIsExpanded;

  const handleToggleExpand = () => {
    if (onToggleExpandProp) {
      onToggleExpandProp();
    } else {
      setLocalIsExpanded(!localIsExpanded);
    }
  };

  // Filtra e ordina i permessi
  const filteredPermissions = useMemo(() => {
    const filtered = permissions.filter((perm) => {
      const matchesSearch =
        perm.permission_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'active' && perm.assigned) ||
        (filterStatus === 'inactive' && !perm.assigned);

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      const comparison = a.permission_code.localeCompare(b.permission_code);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [permissions, searchTerm, filterStatus, sortOrder]);

  const activeCount = permissions.filter((p) => p.assigned).length;
  const hasFilters = searchTerm !== '' || filterStatus !== 'all' || sortOrder !== 'asc';

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <button
        onClick={handleToggleExpand}
        className="w-full px-4 sm:px-6 py-4 border-b flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <div className="flex flex-1 items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Permessi</h2>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
            {activeCount}/{permissions.length}
          </span>
        </div>
        <div className="text-muted-foreground transition-transform duration-200">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Filters Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Cerca permesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Tutti i permessi</option>
                <option value="active">Solo attivi</option>
                <option value="inactive">Solo disattivati</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
              </select>

              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setSortOrder('asc');
                  }}
                  className="h-10 px-3"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Permissions List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredPermissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">Nessun permesso trovato</p>
                {hasFilters && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prova a modificare i filtri di ricerca
                  </p>
                )}
              </div>
            ) : (
              filteredPermissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{perm.permission_code}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {perm.description}
                    </p>
                  </div>
                  <Switch
                    checked={perm.assigned}
                    onCheckedChange={(checked) => onTogglePermission(perm.id, checked)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer Stats */}
          {filteredPermissions.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {filteredPermissions.length} di {permissions.length} permessi
                {hasFilters && ' (filtrati)'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
