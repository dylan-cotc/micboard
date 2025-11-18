import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// Display API
export const displayAPI = {
  getData: async (slug?: string) => {
    const response = await api.get('/display/data', {
      params: slug ? { slug } : undefined
    });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Settings
  getSettings: async (locationId: number) => {
    const response = await api.get('/admin/settings', {
      params: { location_id: locationId }
    });
    return response.data;
  },
  updateSettings: async (locationId: number, settings: Record<string, string>) => {
    const response = await api.put('/admin/settings', { location_id: locationId, settings });
    return response.data;
  },

  // Positions
  getPositions: async (locationId?: number) => {
    const response = await api.get('/admin/positions', {
      params: locationId ? { location_id: locationId } : undefined
    });
    return response.data;
  },
  syncPositions: async (locationId: number) => {
    const response = await api.post('/admin/positions/sync', { location_id: locationId });
    return response.data;
  },
  updatePosition: async (id: number, syncEnabled: boolean) => {
    const response = await api.put(`/admin/positions/${id}`, {
      sync_enabled: syncEnabled,
    });
    return response.data;
  },

  // People
  getPeople: async (locationId?: number) => {
    const response = await api.get('/admin/people', {
      params: locationId ? { location_id: locationId } : undefined
    });
    return response.data;
  },
  syncPeople: async (locationId: number) => {
    const response = await api.post('/admin/people/sync', { location_id: locationId });
    return response.data;
  },
  uploadPhoto: async (personId: number, file: File, cropArea?: { x: number; y: number; width: number; height: number }, zoom?: number) => {
    const formData = new FormData();
    formData.append('photo', file);

    if (cropArea) {
      formData.append('crop_x', String(cropArea.x));
      formData.append('crop_y', String(cropArea.y));
      formData.append('crop_width', String(cropArea.width));
      formData.append('crop_height', String(cropArea.height));
    }

    if (zoom !== undefined) {
      formData.append('zoom', String(zoom));
    }

    const response = await api.post(`/admin/people/${personId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updatePhotoPosition: async (id: number, positionX: number, positionY: number, zoom?: number) => {
    const response = await api.put(`/admin/people/${id}/position`, {
      photo_position_x: positionX,
      photo_position_y: positionY,
      photo_zoom: zoom || 1,
    });
    return response.data;
  },
  deletePerson: async (id: number) => {
    const response = await api.delete(`/admin/people/${id}`);
    return response.data;
  },

  // Microphones
  getMicrophones: async (locationId?: number) => {
    const response = await api.get('/admin/microphones', {
      params: locationId ? { location_id: locationId } : undefined
    });
    return response.data;
  },
  createMicrophone: async (name: string, description: string, locationId: number, isSeparator: boolean = false) => {
    const response = await api.post('/admin/microphones', { name, description, location_id: locationId, is_separator: isSeparator });
    return response.data;
  },
  updateMicrophone: async (id: number, name: string, description: string) => {
    const response = await api.put(`/admin/microphones/${id}`, { name, description });
    return response.data;
  },
  deleteMicrophone: async (id: number) => {
    const response = await api.delete(`/admin/microphones/${id}`);
    return response.data;
  },
  assignMicrophone: async (micId: number, personId: number) => {
    const response = await api.post(`/admin/microphones/${micId}/assign/${personId}`);
    return response.data;
  },
  unassignMicrophone: async (micId: number, personId: number) => {
    const response = await api.delete(`/admin/microphones/${micId}/assign/${personId}`);
    return response.data;
  },
  reorderMicrophones: async (microphoneIds: number[]) => {
    const response = await api.put('/admin/microphones/reorder', { microphoneIds });
    return response.data;
  },

  // Setlist
  getSetlist: async (locationId: number) => {
    const response = await api.get('/admin/setlist', {
      params: { location_id: locationId }
    });
    return response.data;
  },
  updateSetlistVisibility: async (locationId: number, hiddenItems: string[]) => {
    const response = await api.put('/admin/setlist/visibility', { location_id: locationId, hiddenItems });
    return response.data;
  },

  // Locations
  getLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },
  createLocation: async (name: string, slug: string, displayName: string, isPrimary: boolean) => {
    const response = await api.post('/admin/locations', {
      name,
      slug,
      display_name: displayName,
      is_primary: isPrimary
    });
    return response.data;
  },
  updateLocation: async (locationId: number, name: string, slug: string, displayName: string, isPrimary: boolean, pcServiceTypeId?: string, timezone?: string) => {
    const response = await api.put(`/admin/locations/${locationId}`, {
      name,
      slug,
      display_name: displayName,
      is_primary: isPrimary,
      pc_service_type_id: pcServiceTypeId,
      timezone
    });
    return response.data;
  },
  deleteLocation: async (locationId: number) => {
    const response = await api.delete(`/admin/locations/${locationId}`);
    return response.data;
  },
  getServiceTypes: async () => {
    const response = await api.get('/admin/locations/service-types');
    return response.data;
  },

  // Display Settings
  getDisplaySettings: async () => {
    const response = await api.get('/admin/display-settings');
    return response.data;
  },
  updateDisplaySettings: async (settings: { position?: 'left' | 'center'; display_mode?: 'church_only' | 'logo_only' | 'both'; timezone?: string; dark_mode?: boolean }) => {
    const response = await api.put('/admin/display-settings', settings);
    return response.data;
  },

  // Logo (backward compatibility)
  getLogo: async () => {
    const response = await api.get('/admin/logo');
    return response.data;
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/admin/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateLogoSettings: async (settings: { position?: 'left' | 'center'; display_mode?: 'church_only' | 'logo_only' | 'both' }) => {
    const response = await api.put('/admin/logo/settings', settings);
    return response.data;
  },
  deleteLogo: async () => {
    const response = await api.delete('/admin/logo');
    return response.data;
  },
};

export default api;
