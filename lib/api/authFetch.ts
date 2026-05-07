import { useAuth } from '@/contexts/AuthContext';
import { FetchOptions } from '@/types/api';

export async function authFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  // Assicurati che i cookie vengano sempre inviati
  const requestOptions: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
  };

  // Prima richiesta
  let response = await fetch(url, requestOptions);

  // Se otteniamo 401 e non siamo su un endpoint di auth, prova refresh
  if (response.status === 401 && !skipAuth && !url.includes('/api/auth/')) {
    try {
      // Prova a fare refresh del token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Refresh riuscito, riprova la richiesta originale
        response = await fetch(url, requestOptions);
      } else {
        // Refresh fallito, redirect a login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Token refresh failed during fetch:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}

// Hook per usare authFetch nei componenti
export function useAuthFetch() {
  const { refreshToken } = useAuth();

  const fetchWithAuth = async (url: string, options: FetchOptions = {}): Promise<Response> => {
    const { skipAuth, ...fetchOptions } = options;

    const requestOptions: RequestInit = {
      ...fetchOptions,
      credentials: 'include',
    };

    let response = await fetch(url, requestOptions);

    if (response.status === 401 && !skipAuth && !url.includes('/api/auth/')) {
      const refreshed = await refreshToken();
      
      if (refreshed) {
        response = await fetch(url, requestOptions);
      } else {
        throw new Error('Authentication failed');
      }
    }

    return response;
  };

  return fetchWithAuth;
}
