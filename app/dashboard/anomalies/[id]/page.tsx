'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, MoreVertical, Trash2, CheckCircle } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';
import { Button } from '@/components/ui/button';
import type { AnomalyListItem } from '@/types';

export default function AnomalyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const authFetch = useAuthFetch();
  const anomalyId = params?.id as string;

  const [anomaly, setAnomaly] = useState<AnomalyListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (anomalyId) {
      fetchAnomalyDetail();
    }
  }, [anomalyId]);

  const fetchAnomalyDetail = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/anomalies/${anomalyId}`);
      const json = await res.json();
      if (json.status === 'success') {
        setAnomaly(json.data);
        setResolutionNotes(json.data.resolutionNotes || '');
      } else {
        setError(json.message || 'Failed to load anomaly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading anomaly');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAnomaly = async () => {
    try {
      setUpdating(true);
      const res = await authFetch(`/api/anomalies/${anomalyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'closed',
          resolutionNotes: resolutionNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowCloseConfirm(false);
        await fetchAnomalyDetail();
      } else {
        setError(json.message || 'Failed to close anomaly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error closing anomaly');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAnomaly = async () => {
    try {
      setUpdating(true);
      const res = await authFetch(`/api/anomalies/${anomalyId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 'success') {
        router.push('/dashboard/anomalies');
      } else {
        setError(json.message || 'Failed to delete anomaly');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting anomaly');
    } finally {
      setUpdating(false);
    }
  };

  const statusBadgeClass = (status: string) =>
    status === 'closed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'in_progress'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusLabel = (status: string) =>
    status === 'closed' ? 'Chiusa' : status === 'in_progress' ? 'In lavorazione' : 'Aperta';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="text-center py-12">Caricamento...</div>
      </div>
    );
  }

  if (!anomaly || error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
        <div className="border rounded-lg bg-card p-6 text-red-600">{error || 'Anomaly not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Dettagli Anomalia</h1>
      </div>

      <div className="border rounded-lg bg-card space-y-4 sm:space-y-6">
        {/* Header con ID e Stato */}
        <div className="p-4 sm:p-6 border-b flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div className="font-mono text-sm text-muted-foreground">#{anomaly.id}</div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(anomaly.status)}`}>
                {statusLabel(anomaly.status)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">{anomaly.description}</h2>
          </div>

          {/* Dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {showMenuDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-lg shadow-lg z-10">
                {anomaly.status !== 'closed' && (
                  <button
                    onClick={() => {
                      setShowCloseConfirm(true);
                      setShowMenuDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Chiudi anomalia
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenuDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div className="px-4 sm:px-6 text-sm text-red-600">{error}</div>}

        {/* Info */}
        <div className="px-4 sm:px-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Segnalata */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Segnalata da</div>
              <div className="text-sm mt-1">{anomaly.reporterName || `#${anomaly.reporterId}` || '-'}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(anomaly.reportedAt).toLocaleString()}</div>
            </div>

            {/* Rivolta a */}
            {anomaly.assignedEmployeeName && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Rivolta a</div>
                <div className="text-sm mt-1">{anomaly.assignedEmployeeName || `#${anomaly.assignedEmployeeId}` || '-'}</div>
              </div>
            )}
          </div>

          {/* Risolta */}
          {anomaly.status === 'closed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Risolta da</div>
                <div className="text-sm mt-1">{anomaly.resolverName || `#${anomaly.resolverId}` || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Data risoluzione</div>
                <div className="text-sm mt-1">{anomaly.resolvedAt ? new Date(anomaly.resolvedAt).toLocaleString() : '-'}</div>
              </div>
            </div>
          )}

          {/* Note di risoluzione */}
          <div className="pt-4 border-t">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              disabled={anomaly.status === 'closed'}
              className="w-full mt-2 p-3 border rounded-lg text-sm bg-muted/30 disabled:opacity-50"
              rows={4}
              placeholder={anomaly.status === 'closed' ? 'Anomalia chiusa' : 'Aggiungi note...'}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full space-y-4 border">
            <h3 className="text-lg font-semibold">Elimina anomalia?</h3>
            <p className="text-sm text-muted-foreground">Questa azione non può essere annullata. L'anomalia verrà eliminata permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={updating}>
                Annulla
              </Button>
              <Button variant="destructive" onClick={handleDeleteAnomaly} disabled={updating}>
                {updating ? 'Eliminando...' : 'Elimina'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full space-y-4 border">
            <h3 className="text-lg font-semibold">Chiudi anomalia?</h3>
            <p className="text-sm text-muted-foreground">L'anomalia verrà contrassegnata come chiusa.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCloseConfirm(false)} disabled={updating}>
                Annulla
              </Button>
              <Button onClick={handleCloseAnomaly} disabled={updating}>
                {updating ? 'Chiudendo...' : 'Chiudi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
