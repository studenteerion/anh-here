'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Settings, UserCircle2 } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CurrentUser = {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string | null;
  departmentId: number;
  departmentName: string | null;
  status: 'active' | 'inactive';
  lastLogin: string | null;
};

export default function SettingsPage() {
  const authFetch = useAuthFetch();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/auth/me');
      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore caricamento profilo utente');
      }
      setUser(json.data);
    } catch (err: any) {
      setError(err?.message || 'Errore durante il caricamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();

      if (json.status !== 'success') {
        throw new Error(json.message || 'Errore durante aggiornamento password');
      }

      setSuccess('Password aggiornata con successo');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Errore durante aggiornamento password');
    } finally {
      setSavingPassword(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="border rounded-lg bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Impostazioni account</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestisci i dati del tuo profilo e la sicurezza dell'account attualmente loggato.
        </p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="border rounded-lg bg-card">
          <div className="p-4 sm:p-6 border-b flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Profilo</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3 text-sm">
            <div><span className="text-muted-foreground">ID:</span> #{user?.employeeId}</div>
            <div><span className="text-muted-foreground">Nome:</span> {user?.firstName} {user?.lastName}</div>
            <div className="break-words"><span className="text-muted-foreground">Email:</span> <span className="break-all">{user?.email}</span></div>
            <div><span className="text-muted-foreground">Ruolo:</span> {user?.roleName || `#${user?.roleId}`}</div>
            <div><span className="text-muted-foreground">Dipartimento:</span> {user?.departmentName || `#${user?.departmentId}`}</div>
            <div><span className="text-muted-foreground">Stato:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>{user?.status === 'active' ? 'Attivo' : 'Inattivo'}</span></div>
            <div>
              <span className="text-muted-foreground">Ultimo accesso:</span>{' '}
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('it-IT') : 'Mai'}
            </div>
          </div>
        </div>

        <div className="border rounded-lg bg-card">
          <div className="p-4 sm:p-6 border-b flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sicurezza</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            <Input
              type="password"
              placeholder="Password attuale"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Nuova password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Conferma nuova password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {savingPassword ? 'Aggiornamento...' : 'Aggiorna password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
