import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';
import type { Position } from '../../types';

export default function Positions() {
  const { selectedLocation } = useLocation();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchPositions();
    }
  }, [selectedLocation]);

  const fetchPositions = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const data = await adminAPI.getPositions(selectedLocation.id);
      setPositions(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load positions' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedLocation) return;

    setSyncing(true);
    setMessage(null);

    try {
      const data = await adminAPI.syncPositions(selectedLocation.id);
      setPositions(data);
      setMessage({ type: 'success', text: 'Positions synced successfully!' });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('service type')) {
        setMessage({ type: 'error', text: 'Please assign a Planning Center service type to this location first' });
      } else {
        setMessage({ type: 'error', text: 'Failed to sync positions from Planning Center' });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async (position: Position) => {
    try {
      await adminAPI.updatePosition(position.id, !position.sync_enabled);
      setPositions(
        positions.map((p) =>
          p.id === position.id ? { ...p, sync_enabled: !p.sync_enabled } : p
        )
      );
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update position' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Positions</h1>
          <p className="text-gray-600 mt-2">Manage which positions to sync from Planning Center</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Planning Center'}
        </button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">No positions found. Sync from Planning Center to get started.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            Sync Positions
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planning Center ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync Enabled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{position.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{position.pc_position_id || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleSync(position)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        position.sync_enabled ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          position.sync_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
