import { Sidebar } from '@/components/sidebar/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          <div className="lg:p-0 pt-16 lg:pt-0 h-full overflow-y-auto overscroll-contain">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
