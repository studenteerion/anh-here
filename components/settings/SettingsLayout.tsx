import { ProfileCard, type ProfileData } from './ProfileCard';
import { PasswordCard } from './PasswordCard';

interface SettingsLayoutProps {
  user: ProfileData | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onChangePassword: () => void;
  isChangingPassword: boolean;
}

export function SettingsLayout({
  user,
  isLoading,
  error,
  success,
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onChangePassword,
  isChangingPassword,
}: SettingsLayoutProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <ProfileCard user={user} isLoading={isLoading} />

        <PasswordCard
          currentPassword={currentPassword}
          onCurrentPasswordChange={onCurrentPasswordChange}
          newPassword={newPassword}
          onNewPasswordChange={onNewPasswordChange}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={onConfirmPasswordChange}
          onSubmit={onChangePassword}
          isLoading={isChangingPassword}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
