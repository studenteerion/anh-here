import { Settings } from 'lucide-react';

interface SettingsHeaderProps {
  title?: string;
  description?: string;
}

export function SettingsHeader({
  title = 'Impostazioni account',
  description = 'Gestisci i dati del tuo profilo e la sicurezza dell&apos;account attualmente loggato.',
}: SettingsHeaderProps) {
  return (
    <div className="border rounded-lg bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
