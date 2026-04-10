'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Save, UserCog, FileClock, History, CheckSquare } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AttendanceHistoryTable } from '@/components/attendances/AttendanceHistoryTable';

type EmployeeDetail = {
  id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  department_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

type Role = {
  id: number;
  role_name: string;
};

type Department = {
  id: number;
  department_name: string;
};

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
};

type EmployeeAnomaly = {
  id: number;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  reportedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
};

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const employeeId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [anomalies, setAnomalies] = useState<EmployeeAnomaly[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'attendance' | 'anomalies' | 'requests'>('attendance');

  const loadAll = async () => {
    if (!employeeId || Number.isNaN(employeeId)) {
      setError('ID dipendente non valido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [employeeRes, rolesRes, departmentsRes, requestsRes, anomaliesRes] = await Promise.all([
        authFetch(`/api/employees/${employeeId}`),
        authFetch('/api/roles'),
        authFetch('/api/departments'),
        authFetch(`/api/requests?employeeId=${employeeId}&page=1&limit=10`),
        authFetch(`/api/anomalies?employeeId=${employeeId}&page=1&limit=20`),
      ]);

      const [employeeJson, rolesJson, departmentsJson, requestsJson, anomaliesJson] = await Promise.all([
        employeeRes.json(),
        rolesRes.json(),
        departmentsRes.json(),
        requestsRes.json(),
        anomaliesRes.json(),
      ]);

      if (employeeJson.status !== 'success') {
        throw new Error(employeeJson.message || 'Errore caricamento dipendente');
      }

      const loadedEmployee = employeeJson.data as EmployeeDetail;
      setEmployee(loadedEmployee);
      setFirstName(loadedEmployee.first_name);
      setLastName(loadedEmployee.last_name);
      setRoleId(loadedEmployee.role_id);
      setDepartmentId(loadedEmployee.department_id);
      setStatus(loadedEmployee.status);

      if (rolesJson.status === 'success') {
        setRoles(rolesJson.data.roles || []);
      }

      if (departmentsJson.status === 'success') {
        setDepartments(departmentsJson.data.departments || []);
      }

      if (requestsJson.status === 'success') {
        setLeaveRequests(requestsJson.data.requests || []);
      }

      if (anomaliesJson.status === 'success') {
        setAnomalies(anomaliesJson.data.anomalies || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante il caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // run once per employee id to avoid refresh loops caused by unstable function references
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleSave = async () => {
    if (!employee) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          roleId,
          departmentId,
          status,
        }),
      });

      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante il salvataggio');
      }

      setSuccess('Informazioni aggiornate con successo');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = (value: string) =>
    value === 'approved'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : value === 'rejected'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  const anomalyStatusBadgeClass = (value: EmployeeAnomaly['status']) =>
    value === 'closed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : value === 'in_progress'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const anomalyStatusLabel = (value: EmployeeAnomaly['status']) =>
    value === 'closed' ? 'Chiusa' : value === 'in_progress' ? 'In lavorazione' : 'Aperta';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-6 text-sm text-muted-foreground">
          Dipendente non trovato.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'elenco
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center gap-2">
          <UserCog className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Profilo dipendente #{employee.id}</h1>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cognome</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ruolo</label>
            <select
              value={roleId ?? ''}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleziona ruolo</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.role_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Dipartimento</label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleziona dipartimento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.department_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">Attivo</option>
              <option value="inactive">Inattivo</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving || !firstName || !lastName || !roleId || !departmentId}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="border rounded-lg overflow-hidden bg-card">
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-card">
              <TabsTrigger value="attendance" icon={<History className="h-4 w-4" />}>
                Presenze / Assenze
              </TabsTrigger>
              <TabsTrigger value="anomalies" icon={<AlertTriangle className="h-4 w-4" />}>
                Anomalie
              </TabsTrigger>
              <TabsTrigger value="requests" icon={<CheckSquare className="h-4 w-4" />}>
                Richieste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="p-0">
              <AttendanceHistoryTable
                defaultPeriod="month"
                defaultLimit={10}
                autoRefresh={false}
                employeeId={employee.id}
                withBorder={false}
              />
            </TabsContent>

            <TabsContent value="anomalies" className="p-0">
              <div className="p-4 sm:p-6 space-y-3">
                {anomalies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna anomalia trovata.</p>
                ) : (
                  anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Anomalia #{anomaly.id}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${anomalyStatusBadgeClass(anomaly.status)}`}>
                          {anomalyStatusLabel(anomaly.status)}
                        </span>
                      </div>
                      <p className="text-sm">{anomaly.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Segnalata il {new Date(anomaly.reportedAt).toLocaleDateString('it-IT')}
                      </p>
                      {anomaly.resolvedAt && (
                        <p className="text-xs text-muted-foreground">
                          Risolta il {new Date(anomaly.resolvedAt).toLocaleDateString('it-IT')}
                        </p>
                      )}
                      {anomaly.resolutionNotes && (
                        <p className="text-xs text-muted-foreground">Note: {anomaly.resolutionNotes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="p-0">
              <div className="p-4 sm:p-6 space-y-3">
                {leaveRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna richiesta trovata.</p>
                ) : (
                  leaveRequests.map((request) => (
                    <div key={request.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{request.type}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dal {new Date(request.startDate).toLocaleDateString('it-IT')} al {new Date(request.endDate).toLocaleDateString('it-IT')}
                      </p>
                      {request.motivation && (
                        <p className="text-xs text-muted-foreground">Motivazione: {request.motivation}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
