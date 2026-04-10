'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, CalendarCheck, Timer } from 'lucide-react';
import { useAuthFetch } from '@/lib/api/authFetch';

interface AttendanceStatus {
  clockedIn: boolean;
  checkinTime: string | null;
  hoursWorkedToday: number;
  lastCheckout: string | null;
  attendancesToday: number;
}

export function ClockInOutCard() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('--:--:--');
  const authFetch = useAuthFetch();

  // Calcola tempo trascorso
  useEffect(() => {
    if (!status?.clockedIn || !status?.checkinTime) {
      setElapsedTime('--:--:--');
      return;
    }

    const updateElapsed = () => {
      const checkinDate = new Date(status.checkinTime!);
      const now = new Date();
      const diff = now.getTime() - checkinDate.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [status?.clockedIn, status?.checkinTime]);

  const fetchStatus = async () => {
    try {
      const response = await authFetch('/api/attendances/status');
      const result = await response.json();
      
      if (result.status === 'success') {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dello status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status ogni 30 secondi
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePunch = async () => {
    setActionLoading(true);
    try {
      const response = await authFetch('/api/attendances/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Refresh status dopo l'azione
        await fetchStatus();
        
        // Notifica la tabella di fare refresh
        if (typeof window !== 'undefined') {
          const refreshFn = (window as typeof window & { __refreshAttendanceHistory?: () => void }).__refreshAttendanceHistory;
          if (refreshFn) {
            refreshFn();
          }
        }
      } else {
        console.error('Errore durante la timbratura:', result.error);
      }
    } catch (error) {
      console.error('Errore durante la timbratura:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastCheckout = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    const today = new Date();
    
    // Controlla se è dello stesso giorno
    const isSameDay = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
    
    if (isSameDay) {
      return `oggi: ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Altrimenti mostra data e ora
    return date.toLocaleString('it-IT', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 sm:h-6 w-5 sm:w-6 text-muted-foreground" />
            <h2 className="text-xl sm:text-2xl font-semibold">Timbratura</h2>
          </div>
          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${
            status?.clockedIn 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {status?.clockedIn ? 'In servizio' : 'Fuori servizio'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-3 sm:mb-6">
          {/* Entrata */}
          <div className="bg-muted/50 rounded-lg p-2 sm:p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Entrata</p>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {status?.clockedIn ? formatTime(status.checkinTime) : '--:--'}
            </p>
          </div>

          {/* Tempo Trascorso */}
          <div className="bg-muted/50 rounded-lg p-2 sm:p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">In Corso</p>
            </div>
            <p className={`text-base sm:text-lg lg:text-xl font-bold ${status?.clockedIn ? 'text-primary' : ''}`}>
              {elapsedTime}
            </p>
          </div>

          {/* Ore Lavorate Oggi */}
          <div className="bg-muted/50 rounded-lg p-2 sm:p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Ore Oggi</p>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">
              {status ? formatHours(status.hoursWorkedToday) : '--h --m'}
            </p>
          </div>

          {/* Timbrature Oggi */}
          <div className="bg-muted/50 rounded-lg p-2 sm:p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Timbrature Oggi</p>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">
              {status?.attendancesToday || 0}
            </p>
          </div>

          {/* Ultima Uscita */}
          <div className="bg-muted/50 rounded-lg p-2 sm:p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Ultima Uscita</p>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {status?.lastCheckout ? formatLastCheckout(status.lastCheckout) : '--:--'}
            </p>
          </div>
        </div>

        {/* Clock In/Out Button */}
        <Button
          onClick={handlePunch}
          disabled={actionLoading}
          className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold flex items-center justify-center gap-2 ${
            status?.clockedIn
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
              : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
          }`}
        >
          {actionLoading ? (
            <div className="animate-spin rounded-full h-5 sm:h-6 w-5 sm:w-6 border-b-2 border-white"></div>
          ) : (
            <>
              {status?.clockedIn ? (
                <>
                  <LogOut className="h-5 sm:h-6 w-5 sm:w-6" />
                  <span className="hidden sm:inline">Timbratura Uscita</span>
                  <span className="sm:hidden">Esci</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 sm:h-6 w-5 sm:w-6" />
                  <span className="hidden sm:inline">Timbratura Entrata</span>
                  <span className="sm:hidden">Entra</span>
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
