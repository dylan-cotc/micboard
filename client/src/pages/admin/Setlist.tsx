import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';

interface SetlistItem {
  title: string;
  type: string;
}

export default function Setlist() {
  const { selectedLocation } = useLocation();
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [planTitle, setPlanTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchData();
    }
  }, [selectedLocation]);

  const fetchData = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const data = await adminAPI.getSetlist(selectedLocation.id);
      setItems(data.items || []);
      setHiddenItems(data.hiddenItems || []);
      setPlanTitle(data.planTitle || '');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load setlist' });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (itemTitle: string) => {
    setHiddenItems((prev) =>
      prev.includes(itemTitle)
        ? prev.filter((title) => title !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const handleSave = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    setMessage(null);

    try {
      await adminAPI.updateSetlistVisibility(selectedLocation.id, hiddenItems);
      setMessage({ type: 'success', text: 'Setlist visibility updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setlist visibility' });
    } finally {
      setSaving(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return '🎵';
      case 'header':
        return '📋';
      case 'media':
        return '📹';
      default:
        return '📄';
    }
  };

  const getItemStyle = (type: string) => {
    switch (type) {
      case 'header':
        return 'font-bold text-lg text-primary';
      case 'song':
        return 'font-semibold';
      default:
        return '';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Setlist Visibility</h1>
        <p className="text-gray-600 mt-2">
          Control which items appear on the public display screen
        </p>
        {planTitle && (
          <p className="text-gray-700 mt-2 font-medium">
            Current Plan: <span className="text-primary">{planTitle}</span>
          </p>
        )}
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

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">
            No setlist found. Make sure Planning Center is configured and there's an upcoming plan.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Setlist Items
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Click the eye icon to toggle visibility. Hidden items will not appear on the public display.
            </p>

            <div className="space-y-2">
              {items.map((item, index) => {
                const isHidden = hiddenItems.includes(item.title);
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      isHidden
                        ? 'bg-gray-100 border-gray-300 opacity-60'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getItemIcon(item.type)}</span>
                      <div>
                        <p className={`${getItemStyle(item.type)} ${isHidden ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleVisibility(item.title)}
                      className={`p-2 rounded-lg transition-colors ${
                        isHidden
                          ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                          : 'text-primary hover:text-primary-700 hover:bg-primary-50'
                      }`}
                      title={isHidden ? 'Show on display' : 'Hide from display'}
                    >
                      {isHidden ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={fetchData}
              disabled={saving}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
