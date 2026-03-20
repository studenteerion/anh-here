'use client';

import { useState, useEffect } from 'react';
import { Attendance } from '@/types/attendances';

export default function TransactionTestPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [punches, setPunches] = useState<Attendance[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('test_token');
    if (savedToken) {
      setToken(savedToken);
      fetchPunches(savedToken);
    }
  }, []);

  const saveToken = () => {
    localStorage.setItem('test_token', token);
    setMessage('✅ Token saved');
    fetchPunches(token);
  };

  const fetchPunches = async (authToken: string) => {
    if (!authToken) return;

    try {
      const response = await fetch('/api/attendances/history?period=week', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // L'API ritorna { data: { history: [...], ... } }
        // history è un array di giorni, ognuno con attendances
        // Estraiamo tutte le attendances e le convertiamo nel formato Attendance
        const allAttendances: Attendance[] = [];
        if (result.data?.history) {
          for (const day of result.data.history) {
            for (const att of day.attendances || []) {
              allAttendances.push({
                id: att.id,
                employee_id: 0, // Non disponibile nella response
                shift_id: 0, // Non disponibile nella response
                start_datetime: new Date(att.checkin),
                end_datetime: att.checkout ? new Date(att.checkout) : undefined,
                created_at: new Date(),
              });
            }
          }
        }
        setPunches(allAttendances);
      }
    } catch (error) {
      console.error('Error fetching punches:', error);
    }
  };

  const handlePunch = async () => {
    if (!token) {
      setMessage('❌ Please enter a token first');
      return;
    }

    setLoading(true);
    setMessage('⏳ Processing...');

    try {
      const response = await fetch('/api/attendances/punch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        await fetchPunches(token);
      } else {
        setMessage(`❌ Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiplePunches = async (count: number) => {
    if (!token) {
      setMessage('❌ Please enter a token first');
      return;
    }

    setLoading(true);
    setMessage(`⏳ Launching ${count} concurrent requests...`);

    const startTime = Date.now();

    try {
      const promises = Array(count).fill(null).map(() =>
        fetch('/api/attendances/punch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).then(r => r.json())
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Debug: log dei risultati
      console.log('Results:', results);

      const attendanceIds = new Set(results.map(r => r.data?.attendanceId).filter(Boolean));
      const successCount = results.filter(r => r.status === 'success').length;
      const errors = results.filter(r => r.status === 'error');

      let errorDetails = '';
      if (errors.length > 0) {
        errorDetails = '\nErrors:\n' + errors.map(e => `- ${e.message}`).join('\n');
      }

      setMessage(
        `✅ Completed in ${duration}ms\n` +
        `${successCount}/${count} successful\n` +
        `Unique IDs: ${attendanceIds.size} (${Array.from(attendanceIds).join(', ')})\n` +
        `${attendanceIds.size === 1 ? '✅ No duplicates - PROTECTED!' : '⚠️ Multiple IDs - Race condition!'}` +
        errorDetails
      );

      await fetchPunches(token);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-green-600">
            ✅ Transaction Test (Protected)
          </h1>
          <p className="text-gray-600 mb-4">
            This endpoint uses <strong>transactions + atomic INSERT</strong> to prevent race conditions.
          </p>
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <strong>Endpoint:</strong> <code>/api/attendances/punch</code>
            <br />
            <strong>Protection:</strong> INSERT...SELECT...WHERE NOT EXISTS (atomic operation)
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter JWT token..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={saveToken}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save Token
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handlePunch}
              disabled={loading || !token}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
            >
              {loading ? '⏳' : '👆'} Punch In/Out
            </button>
            
            <button
              onClick={() => handleMultiplePunches(5)}
              disabled={loading || !token}
              className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              🚀 5x Concurrent
            </button>
            
            <button
              onClick={() => handleMultiplePunches(10)}
              disabled={loading || !token}
              className="px-6 py-3 bg-purple-700 text-white rounded hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              🚀 10x Concurrent
            </button>
            
            <button
              onClick={() => fetchPunches(token)}
              disabled={loading || !token}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <pre className="whitespace-pre-wrap text-sm">{message}</pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Punch History ({punches.length} records)
          </h2>
          
          {punches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No punches found. Try punching in!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Check In</th>
                    <th className="text-left p-3">Check Out</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {punches.map((punch) => (
                    <tr key={punch.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono">{punch.id}</td>
                      <td className="p-3">
                        {new Date(punch.start_datetime).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {punch.end_datetime
                          ? new Date(punch.end_datetime).toLocaleString()
                          : '-'}
                      </td>
                      <td className="p-3">
                        {punch.end_datetime ? (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
                            Open
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/transaction/broken"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            ⚠️ Try the BROKEN version →
          </a>
        </div>
      </div>
    </div>
  );
}
