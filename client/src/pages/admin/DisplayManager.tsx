import { useState, useEffect } from 'react';
import { Plus, MapPin, Monitor, Trash2, Edit } from 'lucide-react';
import { adminAPI } from '../../services/api';

interface Location {
  id: number;
  name: string;
  slug: string;
  display_name: string;
  is_primary: boolean;
  timezone: string;
}

interface Display {
  id: number;
  location_id: number;
  name: string;
  slug: string;
  pc_service_type_id?: string;
  layout_config: any;
  max_people: number;
  is_primary: boolean;
  is_active: boolean;
  location_name: string;
  assignment_count: number;
  created_at: string;
  updated_at: string;
}

export default function DisplayManager() {
  const [activeTab, setActiveTab] = useState<'locations' | 'displays'>('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDisplayModal, setShowAddDisplayModal] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<Display | null>(null);
  const [displayForm, setDisplayForm] = useState({
    location_id: '',
    name: '',
    slug: '',
    pc_service_type_id: '',
    max_people: 20,
    is_primary: false
  });

  useEffect(() => {
    fetchLocations();
    fetchDisplays();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await adminAPI.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchDisplays = async () => {
    try {
      const data = await adminAPI.getDisplays();
      setDisplays(data);
    } catch (error) {
      console.error('Failed to fetch displays:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplaysForLocation = (locationId: number) => {
    return displays.filter(display => display.location_id === locationId);
  };

  const handleAddDisplay = () => {
    setDisplayForm({
      location_id: '',
      name: '',
      slug: '',
      pc_service_type_id: '',
      max_people: 20,
      is_primary: false
    });
    setEditingDisplay(null);
    setShowAddDisplayModal(true);
  };

  const handleEditDisplay = (display: Display) => {
    setDisplayForm({
      location_id: display.location_id.toString(),
      name: display.name,
      slug: display.slug,
      pc_service_type_id: display.pc_service_type_id || '',
      max_people: display.max_people,
      is_primary: display.is_primary
    });
    setEditingDisplay(display);
    setShowAddDisplayModal(true);
  };

  const handleDeleteDisplay = async (displayId: number) => {
    if (!confirm('Are you sure you want to delete this display?')) return;

    try {
      await adminAPI.deleteDisplay(displayId);
      await fetchDisplays();
    } catch (error) {
      console.error('Failed to delete display:', error);
      alert('Failed to delete display');
    }
  };

  const handleSaveDisplay = async () => {
    try {
      const formData = {
        location_id: parseInt(displayForm.location_id),
        name: displayForm.name,
        slug: displayForm.slug,
        pc_service_type_id: displayForm.pc_service_type_id || undefined,
        max_people: displayForm.max_people,
        is_primary: displayForm.is_primary
      };

      if (editingDisplay) {
        await adminAPI.updateDisplay(editingDisplay.id, formData);
      } else {
        await adminAPI.createDisplay(formData);
      }

      setShowAddDisplayModal(false);
      await fetchDisplays();
    } catch (error: any) {
      console.error('Failed to save display:', error);
      alert(error.response?.data?.error || 'Failed to save display');
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
        <h1 className="text-3xl font-bold text-gray-900">Display Manager</h1>
        <p className="text-gray-600 mt-2">Manage locations and their associated displays</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Locations
          </button>
          <button
            onClick={() => setActiveTab('displays')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'displays'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Monitor className="w-4 h-4 inline mr-2" />
            Displays
          </button>
        </nav>
      </div>

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </div>

          <div className="grid gap-4">
            {locations.map(location => (
              <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{location.display_name}</h3>
                      <p className="text-sm text-gray-600">{location.name}</p>
                      <p className="text-xs text-gray-500">Slug: {location.slug}</p>
                    </div>
                    {location.is_primary && (
                      <span className="px-2 py-1 text-xs bg-primary text-white rounded-full">Primary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {getDisplaysForLocation(location.id).length} display(s)
                    </span>
                    <button className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Displays Tab */}
      {activeTab === 'displays' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Displays</h2>
            <button
              onClick={handleAddDisplay}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Display
            </button>
          </div>

          <div className="space-y-8">
            {locations.map(location => {
              const locationDisplays = displays.filter(display => display.location_id === location.id);
              if (locationDisplays.length === 0) return null;

              return (
                <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">{location.display_name}</h3>
                    <span className="text-sm text-gray-600">({locationDisplays.length} display{locationDisplays.length !== 1 ? 's' : ''})</span>
                  </div>

                  <div className="grid gap-4">
                    {locationDisplays.map(display => (
                      <div key={display.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{display.name}</h4>
                              <p className="text-sm text-gray-600">Slug: {display.slug}</p>
                              {display.pc_service_type_id && (
                                <p className="text-sm text-gray-600">Service Type ID: {display.pc_service_type_id}</p>
                              )}
                            </div>
                            {display.is_primary && (
                              <span className="px-2 py-1 text-xs bg-primary text-white rounded-full">Primary</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {display.assignment_count} assignment(s)
                            </span>
                            <button
                              onClick={() => handleEditDisplay(display)}
                              className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDisplay(display.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Display Modal */}
      {showAddDisplayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingDisplay ? 'Edit Display' : 'Add Display'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={displayForm.location_id}
                  onChange={(e) => setDisplayForm({ ...displayForm, location_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayForm.name}
                  onChange={(e) => setDisplayForm({ ...displayForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={displayForm.slug}
                  onChange={(e) => setDisplayForm({ ...displayForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens allowed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type ID (optional)
                </label>
                <input
                  type="text"
                  value={displayForm.pc_service_type_id}
                  onChange={(e) => setDisplayForm({ ...displayForm, pc_service_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max People
                </label>
                <input
                  type="number"
                  value={displayForm.max_people}
                  onChange={(e) => setDisplayForm({ ...displayForm, max_people: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={displayForm.is_primary}
                  onChange={(e) => setDisplayForm({ ...displayForm, is_primary: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
                  Set as primary display for this location
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddDisplayModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDisplay}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
              >
                {editingDisplay ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}