'use client';

import { useState, useEffect } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

type Role = {
  id: number;
  role_name: string;
};

type Department = {
  id: number;
  department_name: string;
};

export default function EmployeeCreateForm({ onCreated, embedded = false }: { onCreated?: () => void; embedded?: boolean }) {
  const authFetch = useAuthFetch();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [rolesRes, depsRes] = await Promise.all([
          authFetch('/api/roles'),
          authFetch('/api/departments'),
        ]);

        const [rolesJson, depsJson] = await Promise.all([
          rolesRes.json(),
          depsRes.json(),
        ]);

        if (rolesJson.status === 'success') {
          setRoles(rolesJson.data.roles || []);
          if (rolesJson.data.roles?.length > 0) {
            setRoleId(String(rolesJson.data.roles[0].id));
          }
        }

        if (depsJson.status === 'success') {
          setDepartments(depsJson.data.departments || []);
          if (depsJson.data.departments?.length > 0) {
            setDepartmentId(String(depsJson.data.departments[0].id));
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento dei dati', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [authFetch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!roleId || !departmentId) {
      setError('Seleziona ruolo e dipartimento');
      return;
    }

    setLoading(true);
    try {
      const body = {
        firstName,
        lastName,
        email,
        roleId: Number(roleId),
        departmentId: Number(departmentId),
        password,
      };
      const res = await authFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setError(json.message || 'Errore nella creazione');
      } else {
        setFirstName(''); setLastName(''); setEmail(''); setRoleId(String(roles[0]?.id || '')); setDepartmentId(String(departments[0]?.id || '')); setPassword('');
        setSuccess('Dipendente creato con successo');
        onCreated && onCreated();
      }
    } catch (err: any) {
      setError(err?.message || 'Errore nella creazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className={embedded ? 'space-y-4' : 'border rounded-lg bg-card'}>
      {!embedded && (
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-semibold">Aggiungi dipendente</h2>
          </div>
        </div>
      )}

      <div className={embedded ? 'space-y-4' : 'p-4 sm:p-6 space-y-4'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cognome</label>
            <Input placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <Input
            placeholder="mario.rossi@azienda.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ruolo</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={loadingOptions || roles.length === 0}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">Seleziona un ruolo</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Dipartimento</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={loadingOptions || departments.length === 0}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="">Seleziona un dipartimento</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Password</label>
          <Input
            placeholder="Almeno 8 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            required
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Creazione...' : 'Crea dipendente'}
          </Button>
        </div>
      </div>
    </form>
  );
}
