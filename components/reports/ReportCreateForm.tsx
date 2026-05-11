'use client';

import { useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReportCreateFormProps {
  onCreated: () => void;
  embedded?: boolean;
}

export function ReportCreateForm({ onCreated, embedded }: ReportCreateFormProps) {
  const authFetch = useAuthFetch();
  const [link, setLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!link.trim()) {
      setError('Inserisci il link del report');
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch('/api/company-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: link.trim() }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setLink('');
        onCreated();
      } else {
        setError(json.message || 'Errore nella creazione del report');
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
      <Input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Link del report"
        type="url"
        className="h-9 text-sm"
      />
      <div className={embedded ? 'flex justify-end gap-2' : ''}>
        <Button
          onClick={handleCreate}
          disabled={creating || !link.trim()}
          className={embedded ? '' : 'w-full'}
        >
          {creating ? 'Creazione...' : 'Crea report'}
        </Button>
      </div>
    </div>
  );
}
