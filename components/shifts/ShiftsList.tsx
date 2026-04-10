'use client';

import { Shift } from '@/types/shifts';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShiftsListProps {
  items: Shift[];
  loading: boolean;
  departments: { id: number; department_name: string }[];
  onEdit: (item: Shift) => void;
  onDelete: (item: Shift) => void;
}

const toTimeInputValue = (value: string) => {
  if (!value) return '';
  const match = value.match(/(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

const getDepartmentName = (departmentId: number, departments: { id: number; department_name: string }[]) =>
  departments.find((d) => d.id === departmentId)?.department_name || '-';

export function ShiftsList({ items, loading, departments, onEdit, onDelete }: ShiftsListProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto p-4 sm:p-6 pt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b bg-muted/40">
            <th className="py-3 px-3 font-semibold">ID</th>
            <th className="py-3 px-3 font-semibold">Nome turno</th>
            <th className="py-3 px-3 font-semibold">Dipartimento</th>
            <th className="py-3 px-3 font-semibold">Inizio</th>
            <th className="py-3 px-3 font-semibold">Fine</th>
            <th className="py-3 px-3 font-semibold text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nessun turno trovato</td></tr>
          ) : items.map((item) => (
            <tr 
              key={item.id} 
              className="border-t hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/shifts/${item.id}`)}
            >
              <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{item.id}</td>
              <td className="py-3 px-3 font-medium">{item.name || '-'}</td>
              <td className="py-3 px-3">{getDepartmentName(item.department_id, departments)}</td>
              <td className="py-3 px-3">{toTimeInputValue(item.start_time) || item.start_time}</td>
              <td className="py-3 px-3">{toTimeInputValue(item.end_time) || item.end_time}</td>
              <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="inline-flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/dashboard/shifts/${item.id}`)}
                    title="Visualizza dettagli"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(item)}
                    title="Modifica"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => onDelete(item)}
                    title="Elimina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
