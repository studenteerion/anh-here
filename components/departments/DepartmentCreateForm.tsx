'use client';

import { useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DepartmentCreateFormProps {
  onCreated: () => void;
  embedded?: boolean;
}

export function DepartmentCreateForm({ onCreated, embedded }: DepartmentCreateFormProps) {
  const authFetch = useAuthFetch();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Inserisci il nome del dipartimento');
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: name.trim() }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setName('');
        onCreated();
      } else {
        setError(json.message || 'Errore nella creazione del dipartimento');
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
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome dipartimento"
        className="h-9 text-sm"
      />
      <div className={embedded ? 'flex justify-end gap-2' : ''}>
        <Button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className={embedded ? '' : 'w-full'}
        >
          {creating ? 'Creazione...' : 'Crea dipartimento'}
        </Button>
      </div>
    </div>
  );
}
