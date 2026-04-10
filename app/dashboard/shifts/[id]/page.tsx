'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Clock, Save, Users, AlertCircle } from 'lucide-react';
import ShiftEmployeeTable from '@/components/shifts/ShiftEmployeeTable';

type Shift = {
  id: number;
  name: string | null;
  start_time: string;
  end_time: string;
  department_id: number;
};

type EmployeeAssignment = {
  id: number;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive';
  attendance_count?: number;
};

type Department = {
  id: number;
  department_name: string;
};

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

  const [employees, setEmployees] = useState<EmployeeAssignment[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

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
        setEmployees(empJson.data.employees || []);
      }
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err?.message || 'Errore di comunicazione');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (error && !shift) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4 flex gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-muted-foreground">Turno non trovato</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <div className="border rounded-lg bg-card">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              {shiftName || `Turno #${shift.id}`}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">ID: #{shift.id}</p>
        </div>

        {/* Shift Info - Editable */}
        <div className="p-4 sm:p-6 border-b space-y-4">
          <h2 className="text-lg font-semibold">Informazioni Turno</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Nome Turno
              </label>
              <Input
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="Es: Turno Mattina"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Dipartimento
              </label>
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

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Orario Inizio
              </label>
              <Input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Orario Fine
              </label>
              <Input
                type="time"
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => fetchData()} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>

        {/* Assigned Employees */}
        <div className="p-4 sm:p-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Dipendenti Assegnati ({employees.length})
            </h2>
          </div>

          <ShiftEmployeeTable employees={employees} loading={employeesLoading} />
        </div>
      </div>
    </div>
  );
}
