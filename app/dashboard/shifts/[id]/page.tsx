'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Save, AlertCircle } from 'lucide-react';
import EmployeeList from '@/components/employees/EmployeeList';
import type { DepartmentOption, EmployeeTableRow, Shift, ShiftEmployeeSummary } from '@/types';

export default function ShiftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const authFetch = useAuthFetch();
  const shiftId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shift, setShift] = useState<Shift | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftDepartmentId, setShiftDepartmentId] = useState('');

  const [employees, setEmployees] = useState<EmployeeTableRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const departmentNameById = useMemo(() => {
    return departments.reduce<Record<number, string>>((acc, dept) => {
      acc[dept.id] = dept.department_name;
      return acc;
    }, {});
  }, [departments]);

  const fetchData = async () => {
    if (!shiftId || Number.isNaN(shiftId)) {
      setError('ID turno non valido');
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const [shiftRes, deptRes, empRes] = await Promise.all([
        authFetch(`/api/shifts/${shiftId}`),
        authFetch('/api/departments'),
        authFetch(`/api/shifts/${shiftId}/employees`),
      ]);

      const [shiftJson, deptJson, empJson] = await Promise.all([
        shiftRes.json(),
        deptRes.json(),
        empRes.json(),
      ]);

      if (shiftJson.status !== 'success') {
        throw new Error(shiftJson.message || 'Turno non trovato');
      }

      const loadedShift = shiftJson.data as Shift;
      setShift(loadedShift);
      setShiftName(loadedShift.name || '');
      setShiftStartTime(loadedShift.start_time.slice(11, 16));
      setShiftEndTime(loadedShift.end_time.slice(11, 16));
      setShiftDepartmentId(String(loadedShift.department_id));

      if (deptJson.status === 'success') {
        setDepartments(deptJson.data.departments || []);
      }

      if (empJson.status === 'success') {
         const emps = (empJson.data.employees || []) as ShiftEmployeeSummary[];
         // Convert employees to EmployeeRow format
         const convertedEmps: EmployeeTableRow[] = emps.map((emp) => ({
           id: emp.id,
           first_name: emp.first_name,
           last_name: emp.last_name,
          role_id: 0,
          department_id: 0,
          status: emp.status || 'active',
          created_at: new Date().toISOString(),
        }));
        setEmployees(convertedEmps);
      }
    } catch (err: unknown) {
      setError(err?.message || 'Errore durante il caricamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId]);

  const handleSave = async () => {
    if (!shiftName.trim()) {
      setError('Nome turno obbligatorio');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Use local date from current shift start time
      const dateStr = shift?.start_time.slice(0, 10) || new Date().toISOString().slice(0, 10);
      
      // Check if end time is before start time (midnight crossing)
      let endDateStr = dateStr;
      if (shiftEndTime < shiftStartTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        endDateStr = tomorrow.toISOString().slice(0, 10);
      }

      const res = await authFetch(`/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shiftName.trim(),
          startTime: `${dateStr}T${shiftStartTime}:00`,
          endTime: `${endDateStr}T${shiftEndTime}:00`,
          departmentId: Number(shiftDepartmentId),
        }),
      });

      const json = await res.json();

      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante il salvataggio');
      }

      setSuccess('Turno salvato con successo');
      await fetchData();
    } catch (err: unknown) {
      setError(err?.message || 'Errore di comunicazione');
    } finally {
      setSaving(false);
    }
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

  if (!shift) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="border rounded-lg bg-card p-6 text-sm text-muted-foreground">
          Turno non trovato.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/shifts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all&apos;elenco
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 flex gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      {/* Shift Info Section */}
      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Informazioni turno #{shift.id}</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nome turno</label>
              <Input
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="Es: Turno Mattina"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Dipartimento</label>
              <select
                value={shiftDepartmentId}
                onChange={(e) => setShiftDepartmentId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Seleziona dipartimento</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Orario Inizio</label>
              <Input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Orario Fine</label>
              <Input
                type="time"
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !shiftName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </div>
      </div>

      {/* Employees Section - Using EmployeeList Component */}
      <EmployeeList staticData={employees} />
    </div>
  );
}
