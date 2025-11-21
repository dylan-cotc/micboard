import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Check, Monitor, Settings } from 'lucide-react';
import { adminAPI } from '../../services/api';
import type { Location } from '../../types';

interface Display {
  id: number;
  location_id: number;
  name: string;
  slug: string;
  pc_service_type_id?: string;
  service_type_name?: string;
  is_primary: boolean;
  max_people: number;
  assignment_count?: number;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showDisplayForm, setShowDisplayForm] = useState(false);
  const [selectedLocationForDisplay, setSelectedLocationForDisplay] = useState<Location | null>(null);
  const [showAddDisplayModal, setShowAddDisplayModal] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<Display | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Location form state
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    slug: '',
    displayName: '',
    isPrimary: false,
    timezone: 'America/New_York',
  });

  // Display form state
  const [displayFormData, setDisplayFormData] = useState({
    location_id: 0,
    name: '',
    slug: '',
    pc_service_type_id: '',
    max_people: 20,
    is_primary: false
  });

  // Display operation states
  const [displayLoading, setDisplayLoading] = useState(false);
  const [deletingDisplayId, setDeletingDisplayId] = useState<number | null>(null);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locationsData, displaysData] = await Promise.all([
        adminAPI.getLocations(),
        adminAPI.getDisplays()
      ]);
      setLocations(locationsData);
      setDisplays(displaysData);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const getDisplaysForLocation = (locationId: number) => {
    return displays.filter(display => display.location_id === locationId);
  };

  const handleDisplayNameChange = (name: string) => {
    setDisplayFormData({
      ...displayFormData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleManageDisplays = (location: Location) => {
    setSelectedLocationForDisplay(location);
    setShowDisplayForm(true);
  };

  const handleNameChange = (name: string) => {
    setLocationFormData({
      ...locationFormData,
      name,
      slug: generateSlug(name),
      displayName: locationFormData.displayName || name,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationFormData.name || !locationFormData.slug || !locationFormData.displayName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      await adminAPI.createLocation(
        locationFormData.name,
        locationFormData.slug,
        locationFormData.displayName,
        locationFormData.isPrimary
      );

      setMessage({ type: 'success', text: 'Location created successfully' });
      setShowCreateForm(false);
      setLocationFormData({ name: '', slug: '', displayName: '', isPrimary: false, timezone: 'America/New_York' });
      await fetchData();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setMessage({ type: 'error', text: 'A location with this slug already exists' });
      } else {
        setMessage({ type: 'error', text: 'Failed to create location' });
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    try {
      await adminAPI.updateLocation(
        editingLocation.id,
        locationFormData.name,
        locationFormData.slug,
        locationFormData.displayName,
        locationFormData.isPrimary,
        undefined, // No service type for locations anymore
        locationFormData.timezone
      );

      setMessage({ type: 'success', text: 'Location updated successfully' });
      setEditingLocation(null);
      setLocationFormData({ name: '', slug: '', displayName: '', isPrimary: false, timezone: 'America/New_York' });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update location' });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      slug: location.slug,
      displayName: location.display_name,
      isPrimary: location.is_primary,
      timezone: location.timezone || 'America/New_York',
    });
    setShowCreateForm(false);
  };

  const handleDelete = async (location: Location) => {
    if (location.is_primary && locations.length > 1) {
      setMessage({
        type: 'error',
        text: 'Cannot delete the primary location. Set another location as primary first.'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${location.name}"? This will also delete all associated data (people, positions, microphones, etc.).`)) {
      return;
    }

    try {
      await adminAPI.deleteLocation(location.id);
      setMessage({ type: 'success', text: 'Location deleted successfully' });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete location' });
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingLocation(null);
    setLocationFormData({ name: '', slug: '', displayName: '', isPrimary: false, timezone: 'America/New_York' });
  };

  // Display CRUD functions
  const handleAddDisplay = () => {
    if (!selectedLocationForDisplay) return;
    setDisplayFormData({
      location_id: selectedLocationForDisplay.id,
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
    setDisplayFormData({
      location_id: display.location_id,
      name: display.name,
      slug: display.slug,
      pc_service_type_id: display.pc_service_type_id || '',
      max_people: display.max_people,
      is_primary: display.is_primary
    });
    setEditingDisplay(display);
    setShowAddDisplayModal(true);
  };

  const handleDeleteDisplay = async (display: Display) => {
    if (!confirm(`Are you sure you want to delete "${display.name}"? This action cannot be undone.`)) return;

    setDeletingDisplayId(display.id);
    try {
      await adminAPI.deleteDisplay(display.id);
      setMessage({ type: 'success', text: 'Display deleted successfully' });
      await fetchData();
    } catch (error: any) {
      console.error('Delete display error:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete display' });
    } finally {
      setDeletingDisplayId(null);
    }
  };

  const handleSaveDisplay = async () => {
    // Form validation
    if (!displayFormData.name.trim()) {
      setMessage({ type: 'error', text: 'Display name is required' });
      return;
    }
    if (!displayFormData.slug.trim()) {
      setMessage({ type: 'error', text: 'Display slug is required' });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(displayFormData.slug)) {
      setMessage({ type: 'error', text: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      return;
    }

    setDisplayLoading(true);
    try {
      const formData = {
        location_id: displayFormData.location_id,
        name: displayFormData.name.trim(),
        slug: displayFormData.slug.trim(),
        pc_service_type_id: displayFormData.pc_service_type_id || undefined,
        max_people: displayFormData.max_people,
        is_primary: displayFormData.is_primary
      };

      if (editingDisplay) {
        await adminAPI.updateDisplay(editingDisplay.id, formData);
        setMessage({ type: 'success', text: 'Display updated successfully' });
      } else {
        await adminAPI.createDisplay(formData);
        setMessage({ type: 'success', text: 'Display created successfully' });
      }

      setShowAddDisplayModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Save display error:', error);
      if (error.response?.status === 409) {
        setMessage({ type: 'error', text: 'A display with this slug already exists' });
      } else {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save display' });
      }
    } finally {
      setDisplayLoading(false);
    }
  };

  const handleCancelDisplayForm = () => {
    setShowAddDisplayModal(false);
    setEditingDisplay(null);
    setDisplayFormData({
      location_id: 0,
      name: '',
      slug: '',
      pc_service_type_id: '',
      max_people: 20,
      is_primary: false
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-2">Manage campus locations and assign service types</p>
        </div>
        {!showCreateForm && !editingLocation && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
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

      {/* Create/Edit Form */}
      {(showCreateForm || editingLocation) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingLocation ? 'Edit Location' : 'Create New Location'}
          </h2>
          <form onSubmit={editingLocation ? handleUpdate : handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationFormData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Main Campus"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationFormData.slug}
                  onChange={(e) => setLocationFormData({ ...locationFormData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., main-campus"
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URL: /location/{locationFormData.slug || 'slug'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationFormData.displayName}
                onChange={(e) => setLocationFormData({ ...locationFormData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Main Campus"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be displayed on the public screen
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone <span className="text-red-500">*</span>
              </label>
              <select
                value={locationFormData.timezone}
                onChange={(e) => setLocationFormData({ ...locationFormData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Phoenix">Mountain Time - Arizona (MST)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                <option value="America/Puerto_Rico">Atlantic Time (AT)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Timezone for displaying current time on the public screen
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationFormData.isPrimary}
                  onChange={(e) => setLocationFormData({ ...locationFormData, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as primary location
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Primary location is served from the root domain
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                {editingLocation ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations Table */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">No locations yet. Create your first location to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Slug</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Displays</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Primary</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{location.name}</div>
                    <div className="text-xs text-gray-500">{location.display_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{location.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">
                        {getDisplaysForLocation(location.id).length} display{getDisplaysForLocation(location.id).length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleManageDisplays(location)}
                        className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {location.is_primary && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Primary
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit location"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display Management Modal */}
      {showDisplayForm && selectedLocationForDisplay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Displays - {selectedLocationForDisplay.display_name}
                </h2>
                <button
                  onClick={() => {
                    setShowDisplayForm(false);
                    setSelectedLocationForDisplay(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Displays for this location</p>
                <button
                  onClick={handleAddDisplay}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Display
                </button>
              </div>

              <div className="space-y-4">
                {getDisplaysForLocation(selectedLocationForDisplay.id).map(display => (
                  <div key={display.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">{display.name}</h4>
                          <p className="text-sm text-gray-600">Slug: {display.slug}</p>
                          {display.service_type_name && (
                            <p className="text-sm text-gray-600">Service: {display.service_type_name}</p>
                          )}
                        </div>
                        {display.is_primary && (
                          <span className="px-2 py-1 text-xs bg-primary text-white rounded-full">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {display.assignment_count || 0} assignment(s)
                        </span>
                        <button
                          onClick={() => handleEditDisplay(display)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit display"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDisplay(display)}
                          disabled={deletingDisplayId === display.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete display"
                        >
                          {deletingDisplayId === display.id ? (
                            <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {getDisplaysForLocation(selectedLocationForDisplay.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No displays configured for this location yet.
                  </div>
                )}
              </div>
            </div>
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
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayFormData.name}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Main Stage Display"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={displayFormData.slug}
                  onChange={(e) => setDisplayFormData({ ...displayFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
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
                  value={displayFormData.pc_service_type_id}
                  onChange={(e) => setDisplayFormData({ ...displayFormData, pc_service_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max People
                </label>
                <input
                  type="number"
                  value={displayFormData.max_people}
                  onChange={(e) => setDisplayFormData({ ...displayFormData, max_people: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="display_is_primary"
                  checked={displayFormData.is_primary}
                  onChange={(e) => setDisplayFormData({ ...displayFormData, is_primary: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="display_is_primary" className="ml-2 block text-sm text-gray-900">
                  Set as primary display for this location
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelDisplayForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDisplay}
                disabled={displayLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {displayLoading && (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {editingDisplay ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
