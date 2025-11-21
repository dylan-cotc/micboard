import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Save, AlertCircle, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';
import type { Settings as SettingsType } from '../../types';

export default function Settings() {
  const { selectedLocation } = useLocation();
  const [settings, setSettings] = useState<SettingsType>({
    church_name: '',
    pc_personal_access_token: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Display settings state
  const [logoPath, setLogoPath] = useState<string>('');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center'>('left');
  const [logoDisplayMode, setLogoDisplayMode] = useState<'church_only' | 'logo_only' | 'both'>('both');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  useEffect(() => {
    fetchSettings();
    fetchLogo();
  }, [selectedLocation]);

  useEffect(() => {
    // Check for any URL parameters that might indicate success/error states
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      setMessage({ type: 'success', text: success });
      // Clean up URL
      window.history.replaceState({}, '', '/admin/settings');
    } else if (error) {
      setMessage({ type: 'error', text: error });
      // Clean up URL
      window.history.replaceState({}, '', '/admin/settings');
    }
  }, []);

  const fetchSettings = async () => {
    if (!selectedLocation) return;

    try {
      const data = await adminAPI.getSettings(selectedLocation.id);
      setSettings(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const data = await adminAPI.getDisplaySettings();
      setLogoPath(data.logo_path || '');
      setLogoPosition(data.logo_position || 'left');
      setLogoDisplayMode(data.logo_display_mode || 'both');
      setDarkMode(data.dark_mode !== undefined ? data.dark_mode : true);
      if (data.logo_path) {
        setLogoPreview(`${import.meta.env.VITE_API_URL || '/api'}/../${data.logo_path}`);
      }
    } catch (error) {
      console.error('Failed to load display settings:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    setSaving(true);
    setMessage(null);

    try {
      await adminAPI.updateSettings(selectedLocation.id, settings as unknown as Record<string, string>);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsType, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    try {
      const response = await adminAPI.uploadLogo(file);
      setLogoPath(response.logo_path);
      setLogoPreview(`${import.meta.env.VITE_API_URL || '/api'}/../${response.logo_path}`);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoPositionChange = async (position: 'left' | 'center') => {
    setMessage(null);

    try {
      await adminAPI.updateDisplaySettings({ position });
      setLogoPosition(position);
      setMessage({ type: 'success', text: 'Logo position updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update logo position' });
    }
  };

  const handleDisplayModeChange = async (display_mode: 'church_only' | 'logo_only' | 'both') => {
    setMessage(null);

    try {
      await adminAPI.updateDisplaySettings({ display_mode });
      setLogoDisplayMode(display_mode);
      setMessage({ type: 'success', text: 'Display mode updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update display mode' });
    }
  };

  const handleDarkModeToggle = async () => {
    setMessage(null);
    const newDarkMode = !darkMode;

    try {
      await adminAPI.updateDisplaySettings({ dark_mode: newDarkMode });
      setDarkMode(newDarkMode);
      setMessage({ type: 'success', text: `${newDarkMode ? 'Dark' : 'Light'} mode enabled!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update display mode' });
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    setMessage(null);

    try {
      await adminAPI.deleteLogo();
      setLogoPath('');
      setLogoPreview(null);
      setMessage({ type: 'success', text: 'Logo deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete logo' });
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your church information and Planning Center integration</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Church Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Church Information</h2>
          <div>
            <label htmlFor="church_name" className="block text-sm font-medium text-gray-700 mb-2">
              Church Name
            </label>
            <input
              type="text"
              id="church_name"
              value={settings.church_name}
              onChange={(e) => handleChange('church_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter church name"
              required
            />
          </div>
        </div>

        {/* Logo Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Logo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a logo to display on the public dashboard (applies to all locations)
          </p>

          <div className="space-y-4">
            {/* Logo Preview */}
            {logoPreview && (
              <div className="flex items-start gap-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 max-w-xs object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <label
                htmlFor="logo-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {logoPath ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </div>

            {/* Display Mode Selection */}
            {logoPath && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Mode
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleDisplayModeChange('church_only')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      logoDisplayMode === 'church_only'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Church Name Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisplayModeChange('logo_only')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      logoDisplayMode === 'logo_only'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Logo Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisplayModeChange('both')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      logoDisplayMode === 'both'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>
            )}

            {/* Position Selection - show when both or logo_only are displayed */}
            {logoPath && (logoDisplayMode === 'both' || logoDisplayMode === 'logo_only') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleLogoPositionChange('left')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      logoPosition === 'left'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Left Align
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogoPositionChange('center')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      logoPosition === 'center'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display Mode Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Display Appearance</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure the appearance of the public dashboard (applies to all locations)
          </p>

          <div>
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                  <p className="text-xs text-gray-500">Enable dark theme for the public display</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Planning Center Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Planning Center Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect to Planning Center using a Personal Access Token for secure access to your service data.
          </p>

          {/* Personal Access Token Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">🔑 Personal Access Token Setup</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>
                Go to your{' '}
                <a
                  href="https://api.planningcenteronline.com/personal_access_tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Planning Center Personal Access Tokens page
                </a>
              </li>
              <li>Click <strong>"Create a new Personal Access Token"</strong></li>
              <li>Give it a descriptive name (e.g., "ServeView Integration")</li>
              <li>Select the appropriate scopes: <strong>services</strong> and <strong>people</strong></li>
              <li>Click <strong>"Create Personal Access Token"</strong></li>
              <li><strong>Copy the token immediately</strong> - you won't be able to see it again!</li>
              <li>Paste the token below and click <strong>Save Settings</strong></li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="pc_token" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                id="pc_token"
                value={settings.pc_personal_access_token}
                onChange={(e) => handleChange('pc_personal_access_token', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                placeholder="Enter your Planning Center Personal Access Token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep this token secure - it's used to authenticate with Planning Center API
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
