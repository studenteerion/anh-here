'use client';

import { useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ShiftCreateFormProps {
  departments: { id: number; department_name: string }[];
  onCreated: () => void;
  embedded?: boolean;
}

const toIsoToday = (time: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return `${today}T${time}:00`;
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
      const res = await authFetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: Number(departmentId),
          name: name.trim() || null,
          startTime: toIsoToday(startTime),
          endTime: toIsoToday(endTime),
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
    } catch (err) {
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
