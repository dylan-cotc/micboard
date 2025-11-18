import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Check } from 'lucide-react';
import { adminAPI } from '../../services/api';
import type { Location, ServiceType } from '../../types';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    displayName: '',
    isPrimary: false,
    serviceTypeId: '',
    timezone: 'America/New_York',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locationsData, serviceTypesData] = await Promise.all([
        adminAPI.getLocations(),
        adminAPI.getServiceTypes(),
      ]);
      setLocations(locationsData);
      setServiceTypes(serviceTypesData);
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

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
      displayName: formData.displayName || name,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.displayName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      await adminAPI.createLocation(
        formData.name,
        formData.slug,
        formData.displayName,
        formData.isPrimary
      );

      // If a service type was selected, update it
      if (formData.serviceTypeId) {
        const locations = await adminAPI.getLocations();
        const newLocation = locations.find(l => l.slug === formData.slug);
        if (newLocation) {
          await adminAPI.updateLocation(
            newLocation.id,
            newLocation.name,
            newLocation.slug,
            newLocation.display_name,
            newLocation.is_primary,
            formData.serviceTypeId,
            formData.timezone
          );
        }
      }

      setMessage({ type: 'success', text: 'Location created successfully' });
      setShowCreateForm(false);
      setFormData({ name: '', slug: '', displayName: '', isPrimary: false, serviceTypeId: '', timezone: 'America/New_York' });
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
        formData.name,
        formData.slug,
        formData.displayName,
        formData.isPrimary,
        formData.serviceTypeId || undefined,
        formData.timezone
      );

      setMessage({ type: 'success', text: 'Location updated successfully' });
      setEditingLocation(null);
      setFormData({ name: '', slug: '', displayName: '', isPrimary: false, serviceTypeId: '', timezone: 'America/New_York' });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update location' });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      slug: location.slug,
      displayName: location.display_name,
      isPrimary: location.is_primary,
      serviceTypeId: location.pc_service_type_id || '',
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
    setFormData({ name: '', slug: '', displayName: '', isPrimary: false, serviceTypeId: '', timezone: 'America/New_York' });
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
                  value={formData.name}
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
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., main-campus"
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URL: /location/{formData.slug || 'slug'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Main Campus"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be displayed on the public screen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planning Center Service Type
                </label>
                <select
                  value={formData.serviceTypeId}
                  onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select service type (optional)</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Assign a Planning Center service type to sync positions and people
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
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
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service Type</th>
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
                    <span className="text-sm text-gray-900">
                      {location.service_type_name || (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </span>
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
    </div>
  );
}
