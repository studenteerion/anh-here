'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    
    if (token) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not authenticated, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 dark:border-white border-r-transparent dark:border-r-transparent"></div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
