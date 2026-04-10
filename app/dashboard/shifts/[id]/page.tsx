'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, Users } from 'lucide-react';
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
};

type Department = {
  id: number;
  department_name: string;
};

export default function ShiftDetailPage() {
  const router = useRouter();
  const params = useParams();
  const authFetch = useAuthFetch();
  const shiftId = Number(params.id);

  const [shift, setShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<EmployeeAssignment[]>([]);
  const [departments, setDepartments] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shift details
        const shiftRes = await authFetch(`/api/shifts`);
        const shiftJson = await shiftRes.json();
        let foundShift: Shift | null = null;

        if (shiftJson.status === 'success') {
          foundShift = (shiftJson.data.shifts || []).find(
            (s: Shift) => s.id === shiftId
          );
          if (foundShift) {
            setShift(foundShift);
          } else {
            setError('Turno non trovato');
            setLoading(false);
            return;
          }
        }

        // Fetch departments
        const deptRes = await authFetch('/api/departments');
        const deptJson = await deptRes.json();
        if (deptJson.status === 'success') {
          const deptMap = new Map<number, string>();
          (deptJson.data.departments || []).forEach((d: Department) => {
            deptMap.set(d.id, d.department_name);
          });
          setDepartments(deptMap);
        }

        // Fetch employees assigned to this shift via dedicated endpoint
        const empRes = await authFetch(`/api/shifts/${shiftId}/employees`);
        const empJson = await empRes.json();
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

    fetchData();
  }, [shiftId, authFetch]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
          {error || 'Turno non trovato'}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const match = time.match(/(\d{2}:\d{2})/);
    return match ? match[1] : time;
  };

  const departmentName = departments.get(shift.department_id) || `#${shift.department_id}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <div className="border rounded-lg bg-card space-y-6">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              {shift.name || `Turno #${shift.id}`}
            </h1>
          </div>
        </div>

        {/* Shift Details */}
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Informazioni Turno</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-lg font-mono">#{shift.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dipartimento</label>
              <p className="text-lg">{departmentName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Orario Inizio</label>
              <p className="text-lg">{formatTime(shift.start_time)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Orario Fine</label>
              <p className="text-lg">{formatTime(shift.end_time)}</p>
            </div>
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

          <ShiftEmployeeTable employees={employees} loading={loading} />
        </div>
      </div>
    </div>
  );
}
