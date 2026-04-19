'use client';

import { useEffect, useState } from 'react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import type { ProfileData } from '@/types/settings';
import type { CurrentUserProfile } from '@/types';

export default function SettingsPage() {
  const authFetch = useAuthFetch();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileData | null>(null);
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
      const data: CurrentUserProfile = json.data;
      setUser({
        id: data.employeeId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        status: data.status,
        lastLogin: data.lastLogin,
        additionalFields: [
          { label: 'Ruolo', value: data.roleName || `#${data.roleId}` },
          { label: 'Dipartimento', value: data.departmentName || `#${data.departmentId}` },
        ],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore durante il caricamento';
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore durante aggiornamento password';
      setError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SettingsLayout
      user={user}
      isLoading={loading}
      error={error}
      success={success}
      currentPassword={currentPassword}
      onCurrentPasswordChange={setCurrentPassword}
      newPassword={newPassword}
      onNewPasswordChange={setNewPassword}
      confirmPassword={confirmPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onChangePassword={handleChangePassword}
      isChangingPassword={savingPassword}
    />
  );
}
