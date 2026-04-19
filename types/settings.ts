/**
 * Settings Component Types
 * Shared types used across settings components
 */

export interface ProfileData {
  id: number | string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastLogin: string | null;
  additionalFields?: Array<{
    label: string;
    value: React.ReactNode;
  }>;
}

export interface ProfileCardProps {
  user: ProfileData | null;
  isLoading: boolean;
}

export interface PasswordCardProps {
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

export interface SettingsLayoutProps {
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
