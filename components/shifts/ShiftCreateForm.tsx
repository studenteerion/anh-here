'use client';

import { useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DepartmentOption } from '@/types';

interface ShiftCreateFormProps {
  departments: DepartmentOption[];
  onCreated: () => void;
  embedded?: boolean;
}

const getLocalDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toIsoTodayWithNextDayIfNeeded = (startTime: string, endTime: string) => {
  const today = getLocalDateStr();
  const startIso = `${today}T${startTime}:00`;
  let endIso = `${today}T${endTime}:00`;
  
  if (endTime < startTime) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
    endIso = `${tomorrowStr}T${endTime}:00`;
  }
  
  return { startIso, endIso };
};

export function ShiftCreateForm({ departments, onCreated, embedded }: ShiftCreateFormProps) {
  const authFetch = useAuthFetch();
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!departmentId || !startTime || !endTime) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setCreating(true);
    try {
      const { startIso, endIso } = toIsoTodayWithNextDayIfNeeded(startTime, endTime);
      
      const res = await authFetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: Number(departmentId),
          name: name.trim() || null,
          startTime: startIso,
          endTime: endIso,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setName('');
        setStartTime('08:00');
        setEndTime('17:00');
        onCreated();
      } else {
        setError(json.message || 'Errore nella creazione del turno');
      }
    } catch {
      setError('Errore di comunicazione con il server');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">Seleziona dipartimento</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.department_name}
            </option>
          ))}
        </select>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome turno (opzionale)"
          className="h-9 text-sm"
        />
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="h-9 text-sm"
        />
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className={embedded ? 'flex justify-end gap-2' : ''}>
        <Button
          onClick={handleCreate}
          disabled={creating || !departmentId}
          className={embedded ? '' : 'w-full'}
        >
          {creating ? 'Creazione...' : 'Crea turno'}
        </Button>
      </div>
    </div>
  );
}
