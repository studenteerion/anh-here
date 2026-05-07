'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshToken: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isProtectedPath = pathname?.startsWith('/dashboard') || pathname?.startsWith('/platform');
  const expectedContext = pathname?.startsWith('/platform') ? 'platform' : 'tenant';

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const payload = await response.json();
        const actualContext = payload?.context === 'platform' ? 'platform' : 'tenant';
        if (isProtectedPath && actualContext !== expectedContext) {
          router.push(payload?.redirectTo || (actualContext === 'platform' ? '/platform/dashboard' : '/dashboard'));
          setIsAuthenticated(false);
          return false;
        }
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [expectedContext, isProtectedPath, router]);

  const validateToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const payload = await response.json();
        const actualContext = payload?.data?.data?.context === 'platform' ? 'platform' : 'tenant';
        if (isProtectedPath && actualContext !== expectedContext) {
          router.push(actualContext === 'platform' ? '/platform/dashboard' : '/dashboard');
          setIsAuthenticated(false);
          return false;
        }
        setIsAuthenticated(true);
        return true;
      } else if (response.status === 401) {
        // Token scaduto, prova a fare refresh
        const refreshed = await refreshToken();
        if (!refreshed && isProtectedPath) {
          router.push('/login');
        }
        return refreshed;
      } else {
        setIsAuthenticated(false);
        if (isProtectedPath) {
          router.push('/login');
        }
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken, router, isProtectedPath, expectedContext]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  // Valida il token all'avvio
  useEffect(() => {
    if (isProtectedPath) {
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, [pathname, validateToken, isProtectedPath]);

  // Auto-refresh ogni 5 minuti (300000ms) - il token dura 10 minuti
  useEffect(() => {
    if (!isAuthenticated || !isProtectedPath) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 5 * 60 * 1000); // 5 minuti

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, pathname, isProtectedPath]);

  // Refresh al ritorno da tab inattivo (dopo 5 minuti)
  useEffect(() => {
    if (!isAuthenticated || !isProtectedPath) return;

    let lastActive = Date.now();

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const inactiveTime = Date.now() - lastActive;
        // Se sono passati più di 5 minuti, forza refresh
        if (inactiveTime > 5 * 60 * 1000) {
          await refreshToken();
        }
      } else {
        lastActive = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, refreshToken, pathname, isProtectedPath]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, refreshToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
