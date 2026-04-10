'use client';

import { useEffect, useState } from 'react';
import { X, Clock, RefreshCw, Plus } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import { ShiftsList } from '@/components/shifts/ShiftsList';
import { ShiftsFilter } from '@/components/shifts/ShiftsFilter';
import { ShiftCreateForm } from '@/components/shifts/ShiftCreateForm';

type Shift = {
  id: number;
  department_id: number;
  name: string | null;
  start_time: string;
  end_time: string;
};

type Department = {
  id: number;
  department_name: string;
};

const toTimeInputValue = (value: string) => {
  if (!value) return '';
  const match = value.match(/(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

const toIsoToday = (time: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return `${today}T${time}:00`;
};

export default function ShiftsPage() {
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState<'all' | number>('all');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'start_time'>('start_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editing, setEditing] = useState<Shift | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingStartTime, setEditingStartTime] = useState('08:00');
  const [editingEndTime, setEditingEndTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Shift | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetchDepartments = async () => {
    const res = await authFetch('/api/departments');
    const json = await res.json();
    if (json.status === 'success') {
      const data = json.data.departments || [];
      setDepartments(data);
    }
  };

  const fetchShifts = async (targetPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();

      if (departmentFilter === 'all') {
        params.append('page', targetPage.toString());
        params.append('limit', limit.toString());
      } else {
        params.append('departmentId', String(departmentFilter));
      }

      const res = await authFetch(`/api/shifts?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        const data = json.data;
        let shiftsList = data.shifts || [];

        // Apply client-side filters and sorting
        if (searchTerm) {
          shiftsList = shiftsList.filter((shift: Shift) =>
            shift.name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Sort
        shiftsList.sort((a: Shift, b: Shift) => {
          let compareValue = 0;
          if (sortBy === 'name') {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            compareValue = nameA.localeCompare(nameB);
          } else {
            const timeA = (a.start_time || '').toString();
            const timeB = (b.start_time || '').toString();
            compareValue = timeA.localeCompare(timeB);
          }
          return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setItems(shiftsList);

        if (departmentFilter === 'all') {
          setPage(data.pagination?.page || 1);
          setTotal(data.pagination?.total || (data.shifts?.length ?? 0));
        } else {
          setPage(1);
          setTotal(shiftsList.length);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchShifts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, departmentFilter]);

  useEffect(() => {
    fetchShifts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openEdit = (item: Shift) => {
    setEditing(item);
    setEditingDepartmentId(item.department_id);
    setEditingName(item.name || '');
    setEditingStartTime(toTimeInputValue(item.start_time) || '08:00');
    setEditingEndTime(toTimeInputValue(item.end_time) || '17:00');
  };

  const handleSaveEdit = async () => {
    if (!editing || !editingDepartmentId || !editingStartTime || !editingEndTime) return;

    setSaving(true);
    try {
      const res = await authFetch(`/api/shifts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: editingDepartmentId,
          name: editingName.trim() || null,
          startTime: toIsoToday(editingStartTime),
          endTime: toIsoToday(editingEndTime),
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setEditing(null);
        fetchShifts(page, true);
      } else {
        alert('Errore: ' + (json.message || 'Impossibile salvare il turno'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    setDeletingBusy(true);
    try {
      const res = await authFetch(`/api/shifts/${deleting.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 'success') {
        setDeleting(null);
        fetchShifts(page, true);
      }
    } finally {
      setDeletingBusy(false);
    }
  };

  const onShiftCreated = () => {
    setShowCreateModal(false);
    fetchShifts(1, true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="border rounded-lg bg-card">
        <div className="p-4 sm:p-6 border-b space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg sm:text-xl font-semibold">Elenco turni</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo turno
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchShifts(page, true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>
        </div>

        <ShiftsFilter
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          departments={departments}
          limit={limit}
          onLimitChange={setLimit}
          departmentFilterActive={departmentFilter !== 'all'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          total={total}
        />

        <ShiftsList
          items={items}
          loading={loading}
          departments={departments}
          onEdit={openEdit}
          onDelete={setDeleting}
        />

        <div className="px-4 sm:px-6 py-4 border-t flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">Pagina {page} di {departmentFilter === 'all' ? totalPages : 1}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchShifts(page - 1)} disabled={departmentFilter !== 'all' || page <= 1}>Precedente</Button>
            <Button variant="outline" size="sm" onClick={() => fetchShifts(page + 1)} disabled={departmentFilter !== 'all' || page >= totalPages}>Successiva</Button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-lg sm:text-xl font-semibold">Crea nuovo turno</h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <ShiftCreateForm
                departments={departments}
                onCreated={onShiftCreated}
                embedded
              />
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-semibold">Modifica turno</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={editingDepartmentId ?? ''}
                onChange={(e) => setEditingDepartmentId(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Seleziona dipartimento</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.department_name}</option>
                ))}
              </select>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Nome turno"
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <input
                type="time"
                value={editingStartTime}
                onChange={(e) => setEditingStartTime(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <input
                type="time"
                value={editingEndTime}
                onChange={(e) => setEditingEndTime(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Annulla</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editingDepartmentId || !editingStartTime || !editingEndTime}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-semibold">Conferma eliminazione</h3>
            <p className="text-sm text-muted-foreground">
              Sei sicuro di voler eliminare il turno <b>{deleting.name || 'Senza nome'}</b> (ID #{deleting.id})?
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
