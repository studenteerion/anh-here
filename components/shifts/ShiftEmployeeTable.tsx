'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ShiftEmployeeSummary } from '@/types';

export default function ShiftEmployeeTable({
  employees,
  loading = false,
}: {
  employees: ShiftEmployeeSummary[];
  loading?: boolean;
}) {
  const router = useRouter();

  const statusBadgeClass = (status: ShiftEmployeeSummary['status']) =>
    status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b bg-muted/40">
            <th className="w-1/12 py-3 px-3 font-semibold">ID</th>
            <th className="w-3/12 py-3 px-3 font-semibold">Nome</th>
            <th className="w-3/12 py-3 px-3 font-semibold">Cognome</th>
            <th className="w-2/12 py-3 px-3 font-semibold">Stato</th>
            <th className="w-2/12 py-3 px-3 font-semibold hidden sm:table-cell">Presenze</th>
            <th className="w-1/12 py-3 px-3 text-right font-semibold">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-4 px-3 text-center text-muted-foreground">
                Caricamento...
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 px-3 text-center text-muted-foreground">
                Nessun dipendente assegnato a questo turno
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr
                key={emp.id}
                className="border-t hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/dashboard/employees/${emp.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Apri dettaglio dipendente ${emp.first_name} ${emp.last_name}`}
              >
                <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                  #{emp.id}
                </td>
                <td className="py-2.5 px-3 font-medium truncate">{emp.first_name}</td>
                <td className="py-2.5 px-3 truncate">{emp.last_name}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                      emp.status
                    )}`}
                  >
                    {emp.status === 'active' ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                  {emp.attendance_count || 0}
                </td>
                <td className="py-2.5 px-3 text-right" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Apri menu azioni per ${emp.first_name} ${emp.last_name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp.id}`)}>
                        Visualizza dettaglio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
