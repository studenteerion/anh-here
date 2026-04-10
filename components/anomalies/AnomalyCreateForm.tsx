'use client';

import { useEffect, useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
};

interface AnomalyCreateFormProps {
  onCreated?: () => void;
  embedded?: boolean;
}

export function AnomalyCreateForm({ onCreated, embedded }: AnomalyCreateFormProps) {
  const authFetch = useAuthFetch();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await authFetch('/api/employees');
        const json = await res.json();
        if (json.status === 'success') {
          setEmployees(json.data.employees || []);
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedEmployeeId || !description.trim()) {
        setError('Seleziona un dipendente e inserisci una descrizione');
        setLoading(false);
        return;
      }

      const res = await authFetch('/api/anomalies', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(selectedEmployeeId),
          description: description.trim(),
        }),
      });

      const json = await res.json();

      if (json.status === 'success') {
        setSelectedEmployeeId('');
        setDescription('');
        onCreated?.();
      } else {
        setError(json.message || 'Errore durante la creazione');
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Dipendente</label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          required
        >
          <option value="">Seleziona un dipendente...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrizione</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrivi l'anomalia..."
          className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Creando...' : 'Crea anomalia'}
        </Button>
      </div>
    </form>
  );
}
