import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordCardProps {
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function PasswordCard({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSubmit,
  isLoading,
  disabled = false,
}: PasswordCardProps) {
  const isFormValid = currentPassword && newPassword && confirmPassword;

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 sm:p-6 border-b flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Password</h2>
      </div>
      <div className="p-4 sm:p-6 space-y-3">
        <Input
          type="password"
          placeholder="Password attuale"
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
          disabled={disabled || isLoading}
        />
        <Input
          type="password"
          placeholder="Nuova password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          disabled={disabled || isLoading}
        />
        <Input
          type="password"
          placeholder="Conferma nuova password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          disabled={disabled || isLoading}
        />
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={!isFormValid || isLoading || disabled}>
            {isLoading ? 'Aggiornamento...' : 'Aggiorna password'}
          </Button>
        </div>
      </div>
    </div>
  );
}
