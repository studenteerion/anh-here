'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Save, Users } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Department = {
  id: number;
  department_name: string;
};

type DepartmentEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  status: 'active' | 'inactive';
  createdAt: string;
};

type Role = {
  id: number;
  role_name: string;
};

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const departmentId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [department, setDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');

  const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roles, setRoles] = useState<Role[]>([]);

  const totalPages = Math.max(1, Math.ceil(employeeTotal / limit));

  const roleNameById = useMemo(() => {
    return roles.reduce<Record<number, string>>((acc, role) => {
      acc[role.id] = role.role_name;
      return acc;
    }, {});
  }, [roles]);

  const fetchData = async (targetPage = page, isRefresh = false) => {
    if (!departmentId || Number.isNaN(departmentId)) {
      setError('ID dipartimento non valido');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [departmentRes, employeesRes, rolesRes] = await Promise.all([
        authFetch(`/api/departments/${departmentId}`),
        authFetch(
          `/api/departments/${departmentId}/employees?page=${targetPage}&limit=${limit}${
            statusFilter !== 'all' ? `&status=${statusFilter}` : ''
          }${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`
        ),
        authFetch('/api/roles'),
      ]);

      const [departmentJson, employeesJson, rolesJson] = await Promise.all([
        departmentRes.json(),
        employeesRes.json(),
        rolesRes.json(),
      ]);

      if (departmentJson.status !== 'success') {
        throw new Error(departmentJson.message || 'Errore caricamento dipartimento');
      }

      const loadedDepartment = departmentJson.data as Department;
      setDepartment(loadedDepartment);
      setDepartmentName(loadedDepartment.department_name);

      if (employeesJson.status === 'success') {
        setEmployees(employeesJson.data.employees || []);
        setEmployeeTotal(employeesJson.data.pagination?.total || (employeesJson.data.employees?.length ?? 0));
        setPage(employeesJson.data.pagination?.page || 1);
      }

      if (rolesJson.status === 'success') {
        setRoles(rolesJson.data.roles || []);
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
  }, [departmentId, page, limit, statusFilter, searchTerm]);

  const handleSave = async () => {
    if (!department || !departmentName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/departments/${department.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: departmentName.trim() }),
      });

      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante il salvataggio');
      }

      setSuccess('Dipartimento aggiornato con successo');
      await fetchData(page, true);
    } catch (err: any) {
      setError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = (status: DepartmentEmployee['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'inactive'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const renderFiltersSection = (position: 'top' | 'bottom') => (
    <div className={`${position === 'top' ? 'border-b p-4 sm:p-6 space-y-4' : 'border-t p-4 sm:p-6 space-y-4'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cerca (nome, cognome, ID)"
          className="lg:col-span-2"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">Tutti gli stati</option>
          <option value="active">Solo attivi</option>
          <option value="inactive">Solo inattivi</option>
        </select>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground">Totale risultati: {employeeTotal}</p>
        <Button variant="outline" size="sm" onClick={() => fetchData(page, true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>
    </div>
  );

  const renderPaginationSection = (position: 'top' | 'bottom') => {
    if (totalPages <= 1) return null;
    return (
      <div className={`px-3 sm:px-6 py-4 ${position === 'top' ? 'border-b' : 'border-t'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-xs sm:text-sm text-muted-foreground">
          Pagina {page} di {totalPages}
          <span className="hidden sm:inline"> ({employeeTotal} dipendenti)</span>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={!hasPrevPage} className="flex-shrink-0" title="Prima pagina">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrevPage} className="flex-1 sm:flex-none">
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Precedente</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNextPage} className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">Successiva</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} disabled={!hasNextPage} className="flex-shrink-0" title="Ultima pagina">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-6 text-sm text-muted-foreground">
          Dipartimento non trovato.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/departments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'elenco
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Informazioni dipartimento #{department.id}</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          <div className="space-y-1 max-w-xl">
            <label className="text-xs text-muted-foreground">Nome dipartimento</label>
            <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={handleSave} disabled={saving || !departmentName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Dipendenti del dipartimento</h2>
          </div>
        </div>

        {renderFiltersSection('top')}
        {renderPaginationSection('top')}

        <div className="overflow-x-auto p-4 sm:p-6 pt-4">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="w-1/12">ID</th>
                <th className="w-2/12">Nome</th>
                <th className="w-2/12">Cognome</th>
                <th className="w-3/12">Ruolo</th>
                <th className="w-2/12">Status</th>
                <th className="w-2/12">Creato</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-muted-foreground">Nessun dipendente in questo dipartimento</td></tr>
              ) : employees.map((employeeItem) => (
                <tr
                  key={employeeItem.id}
                  className="border-t hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/dashboard/employees/${employeeItem.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/dashboard/employees/${employeeItem.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Apri dettaglio dipendente ${employeeItem.firstName} ${employeeItem.lastName}`}
                >
                  <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">#{employeeItem.id}</td>
                  <td className="py-2.5 pr-2 font-medium truncate">{employeeItem.firstName}</td>
                  <td className="py-2.5 pr-2 truncate">{employeeItem.lastName}</td>
                  <td className="py-2.5 pr-2 truncate">{roleNameById[employeeItem.roleId] || `Ruolo #${employeeItem.roleId}`}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(employeeItem.status)}`}>
                      {employeeItem.status === 'active' ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="py-2.5">{new Date(employeeItem.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPaginationSection('bottom')}
        {renderFiltersSection('bottom')}
      </div>
    </div>
  );
}
