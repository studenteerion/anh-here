import { UserCircle2 } from 'lucide-react';
import type { ProfileCardProps } from '@/types/settings';

export function ProfileCard({ user, isLoading }: ProfileCardProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg bg-card p-4 sm:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 sm:p-6 border-b flex items-center gap-2">
        <UserCircle2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Profilo</h2>
      </div>
      <div className="p-4 sm:p-6 space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">ID:</span> #{user?.id}
        </div>
        <div>
          <span className="text-muted-foreground">Nome:</span> {user?.name}
        </div>
        <div className="break-words">
          <span className="text-muted-foreground">Email:</span> <span className="break-all">{user?.email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Stato:</span>{' '}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              user?.status === 'active'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {user?.status === 'active' ? 'Attivo' : 'Inattivo'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Ultimo accesso:</span>{' '}
          {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('it-IT') : 'Mai'}
        </div>

        {user?.additionalFields && user.additionalFields.length > 0 && (
          <>
            {user.additionalFields.map((field, index) => (
              <div key={index}>
                <span className="text-muted-foreground">{field.label}:</span> {field.value}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
