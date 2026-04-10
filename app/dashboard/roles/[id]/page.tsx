'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Save,
  Shield,
  Users,
} from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RolePermissionsSection } from '@/components/roles/RolePermissionsSection';
import { RoleEmployeesSection } from '@/components/roles/RoleEmployeesSection';

type Role = {
  id: number;
  role_name: string;
};

type RoleEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  departmentId: number;
  status: 'active' | 'inactive';
  createdAt: string;
};

type Department = {
  id: number;
  department_name: string;
};

type Permission = {
  id: number;
  permission_code: string;
  description: string;
};

type RolePermission = Permission & {
  assigned: boolean;
};

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const roleId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');

  const [employees, setEmployees] = useState<RoleEmployee[]>([]);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [expandedSection, setExpandedSection] = useState<'employees' | 'permissions' | null>('employees');

  const totalPages = Math.max(1, Math.ceil(employeeTotal / limit));
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const departmentNameById = useMemo(() => {
    return departments.reduce<Record<number, string>>((acc, department) => {
      acc[department.id] = department.department_name;
      return acc;
    }, {});
  }, [departments]);

  const fetchData = async (targetPage = page, isRefresh = false) => {
    if (!roleId || Number.isNaN(roleId)) {
      setError('ID ruolo non valido');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [roleRes, employeesRes, departmentsRes, allPermsRes, rolePermsRes] = await Promise.all([
        authFetch(`/api/roles/${roleId}`),
        authFetch(
          `/api/roles/${roleId}/employees?page=${targetPage}&limit=${limit}${
            statusFilter !== 'all' ? `&status=${statusFilter}` : ''
          }${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`
        ),
        authFetch('/api/departments'),
        authFetch('/api/permissions/all'),
        authFetch(`/api/roles/${roleId}/permissions`),
      ]);

      const [roleJson, employeesJson, departmentsJson, allPermsJson, rolePermsJson] = await Promise.all([
        roleRes.json(),
        employeesRes.json(),
        departmentsRes.json(),
        allPermsRes.json(),
        rolePermsRes.json(),
      ]);

      if (roleJson.status !== 'success') {
        throw new Error(roleJson.message || 'Errore caricamento ruolo');
      }

      const loadedRole = roleJson.data as Role;
      setRole(loadedRole);
      setRoleName(loadedRole.role_name);

      if (employeesJson.status === 'success') {
        setEmployees(employeesJson.data.employees || []);
        setEmployeeTotal(employeesJson.data.pagination?.total || (employeesJson.data.employees?.length ?? 0));
        setPage(employeesJson.data.pagination?.page || 1);
      }

      if (departmentsJson.status === 'success') {
        setDepartments(departmentsJson.data.departments || []);
      }

      if (allPermsJson.status === 'success') {
        const allPerms = allPermsJson.data.permissions || [];
        setAllPermissions(allPerms);

        if (rolePermsJson.status === 'success') {
          const rolePerms = rolePermsJson.data.permissions || [];
          const rolePermIds = new Set(rolePerms.map((p: Permission) => p.id));
          const combined = allPerms.map((p: Permission) => ({
            ...p,
            assigned: rolePermIds.has(p.id),
          }));
          setRolePermissions(combined);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante il caricamento dei dati');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, page, limit, statusFilter, searchTerm]);

  const handleSave = async () => {
    if (!role || !roleName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: roleName.trim() }),
      });

      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante il salvataggio');
      }

      setSuccess('Ruolo aggiornato con successo');
      await fetchData(page, true);
    } catch (err: any) {
      setError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = async (permissionId: number, isAllowed: boolean) => {
    try {
      const res = await authFetch(`/api/roles/${role!.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionId,
          isAllowed: isAllowed ? 1 : 0,
        }),
      });

      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante la modifica');
      }

      setRolePermissions((prev) =>
        prev.map((p) =>
          p.id === permissionId ? { ...p, assigned: isAllowed } : p
        )
      );
    } catch (err: any) {
      console.error('Errore durante la modifica del permesso:', err?.message);
    }
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const statusBadgeClass = (status: RoleEmployee['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'inactive'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-6 text-sm text-muted-foreground">
          Ruolo non trovato.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/roles')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'elenco
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Informazioni ruolo #{role.id}</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          <div className="space-y-1 max-w-xl">
            <label className="text-xs text-muted-foreground">Nome ruolo</label>
            <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={handleSave} disabled={saving || !roleName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sezione Dipendenti con collasso */}
      <RoleEmployeesSection
        isExpanded={expandedSection === 'employees'}
        onToggleExpand={() => setExpandedSection(expandedSection === 'employees' ? null : 'employees')}
        employees={employees}
        departmentNameById={departmentNameById}
        onEmployeeClick={(id) => router.push(`/dashboard/employees/${id}`)}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        limit={limit}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />

      {/* Sezione Permessi - collassata */}
      {role && rolePermissions.length > 0 && (
        <RolePermissionsSection
          roleId={role.id}
          permissions={rolePermissions}
          onTogglePermission={handlePermissionToggle}
          isExpanded={expandedSection === 'permissions'}
          onToggleExpand={() => setExpandedSection(expandedSection === 'permissions' ? null : 'permissions')}
        />
      )}
    </div>
  );
}
