'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Valida il token (legge automaticamente dal cookie)
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          credentials: 'include', // Invia i cookie
        });

        if (response.ok) {
          // Token valido, mostra dashboard
          setIsChecking(false);
        } else {
          // Token non valido, prova refresh
          const refreshed = await tryRefreshToken();
          if (!refreshed) {
            router.push('/login');
            return;
          }
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Errore validazione token:', error);
        // In caso di errore, prova refresh
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
          router.push('/login');
          return;
        }
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const tryRefreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Invia cookie HttpOnly
      });

      return response.ok;
    } catch (error) {
      console.error('Errore refresh token:', error);
      return false;
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return <div>sei loggato</div>;
}
