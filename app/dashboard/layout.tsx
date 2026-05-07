import { Sidebar } from '@/components/sidebar/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-svh lg:h-screen">
        <Sidebar />
        <main className="flex-1 bg-zinc-50 dark:bg-zinc-900 min-w-0 overflow-y-auto">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
