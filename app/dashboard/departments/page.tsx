'use client';

import { useEffect, useState } from 'react';
import { Building2, MoreHorizontal, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Department = {
  id: number;
  department_name: string;
};

export default function DepartmentsPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleting, setDeleting] = useState<Department | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetchDepartments = async (targetPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await authFetch(`/api/departments?page=${targetPage}&limit=${limit}`);
      const json = await res.json();
      if (json.status === 'success') {
        const data = json.data;
        setItems(data.departments || []);
        setPage(data.pagination?.page || 1);
        setTotal(data.pagination?.total || (data.departments?.length ?? 0));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleOnPage = items.length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: newName.trim() }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setNewName('');
        fetchDepartments(1, true);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await authFetch(`/api/departments/${deleting.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 'success') {
        setDeleting(null);
        fetchDepartments(page, true);
      }
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="border rounded-lg bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg sm:text-xl font-semibold">Gestione dipartimenti</h1>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nuovo dipartimento" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creazione...' : 'Aggiungi'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">Totale dipartimenti: {total}</div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => fetchDepartments(page, true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Nome dipartimento</th>
                <th className="py-2 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-4 text-muted-foreground">Caricamento...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-muted-foreground">Nessun dipartimento trovato</td></tr>
              ) : items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/dashboard/departments/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/dashboard/departments/${item.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Apri dettaglio dipartimento ${item.department_name}`}
                >
                  <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">#{item.id}</td>
                  <td className="py-2 pr-2 font-medium">{item.department_name}</td>
                  <td className="py-2 text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Apri menu azioni per dipartimento ${item.department_name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/departments/${item.id}`)}>
                          Informazioni aggiuntive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/departments/${item.id}`)}>
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(item)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">Pagina {page} di {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchDepartments(page - 1)} disabled={page <= 1}>Precedente</Button>
            <Button variant="outline" size="sm" onClick={() => fetchDepartments(page + 1)} disabled={page >= totalPages}>Successiva</Button>
          </div>
        </div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-semibold">Conferma eliminazione</h3>
            <p className="text-sm text-muted-foreground">
              Sei sicuro di voler eliminare il dipartimento <b>{deleting.department_name}</b> (ID #{deleting.id})?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={deletingBusy}>Annulla</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deletingBusy}>{deletingBusy ? 'Eliminazione...' : 'Elimina'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
