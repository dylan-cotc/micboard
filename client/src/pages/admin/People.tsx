import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Trash2, CheckCircle, AlertCircle, Search, MoveHorizontal, MoveVertical, ZoomIn } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';
import type { Person } from '../../types';
import PhotoCropModal from '../../components/PhotoCropModal';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

export default function People() {
  const { selectedLocation } = useLocation();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchPeople();
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPeople(
        people.filter(
          (p) =>
            p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.position_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredPeople(people);
    }
  }, [searchTerm, people]);

  const fetchPeople = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const data = await adminAPI.getPeople(selectedLocation.id);
      setPeople(data);
      setFilteredPeople(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load people' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedLocation) return;

    setSyncing(true);
    setMessage(null);

    try {
      const response = await adminAPI.syncPeople(selectedLocation.id);
      setMessage({ type: 'success', text: response.message || 'People synced successfully!' });
      await fetchPeople();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to sync people from Planning Center'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFileSelect = (personId: number, file: File) => {
    setSelectedPersonId(personId);
    setSelectedFile(file);

    // Create preview URL for the crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedAreaPixels: Area, zoom: number) => {
    if (!selectedFile || !selectedPersonId || !imagePreviewUrl) return;

    setUploadingId(selectedPersonId);
    setCropModalOpen(false);
    setMessage(null);

    try {
      // Create a cropped image blob
      const croppedBlob = await getCroppedImg(imagePreviewUrl, croppedAreaPixels);

      // Convert blob to file
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      await adminAPI.uploadPhoto(selectedPersonId, croppedFile);
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      await fetchPeople();
    } catch (error) {
      console.error('Crop error:', error);
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setUploadingId(null);
      setSelectedFile(null);
      setSelectedPersonId(null);
      setImagePreviewUrl(null);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setSelectedFile(null);
    setSelectedPersonId(null);
    setImagePreviewUrl(null);
  };

  const handlePositionChange = async (personId: number, posX: number, posY: number, zoom?: number) => {
    try {
      await adminAPI.updatePhotoPosition(personId, posX, posY, zoom);
      // Update local state
      setPeople(prevPeople =>
        prevPeople.map(p =>
          p.id === personId
            ? { ...p, photo_position_x: posX, photo_position_y: posY, photo_zoom: zoom || p.photo_zoom }
            : p
        )
      );
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update photo position' });
    }
  };

  const handleDelete = async (person: Person) => {
    if (!confirm(`Are you sure you want to delete ${person.first_name} ${person.last_name}?`)) {
      return;
    }

    try {
      await adminAPI.deletePerson(person.id);
      setMessage({ type: 'success', text: 'Person deleted successfully!' });
      await fetchPeople();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete person' });
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
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600 mt-2">Manage people synced from Planning Center</p>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* People Grid */}
      {filteredPeople.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'No people found matching your search.'
              : 'No people synced yet. Sync from Planning Center to get started.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              Sync People
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPeople.map((person) => (
            <div key={person.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-2 gap-4 p-4">
                {/* Portrait Preview Frame - Shows exactly how it will appear on display */}
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-700 mb-2">Display Preview</p>
                  <div className="relative bg-gray-200 rounded overflow-hidden" style={{ aspectRatio: '2/5', width: '100%' }}>
                    {person.photo_path ? (
                      <img
                        src={`${API_BASE_URL}/${person.photo_path}`}
                        alt={`${person.first_name} ${person.last_name}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          transform: `translate(${((person.photo_position_x || 50) - 50) * 0.3}%, ${((person.photo_position_y || 50) - 50) * 0.3}%) scale(${person.photo_zoom || 1})`,
                          transformOrigin: 'center center',
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {person.first_name[0]}{person.last_name[0]}
                        </span>
                      </div>
                    )}
                    {/* Upload Overlay */}
                    <label
                      className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer ${
                        uploadingId === person.id ? 'opacity-100' : ''
                      }`}
                    >
                      {uploadingId === person.id ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      ) : (
                        <Upload className="w-6 h-6 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(person.id, file);
                        }}
                        disabled={uploadingId !== null}
                      />
                    </label>
                  </div>
                </div>

                {/* Position & Zoom Controls */}
                {person.photo_path && (
                  <div className="flex flex-col">
                    <p className="text-xs font-medium text-gray-700 mb-2">Adjust Position & Zoom</p>
                    <div className="space-y-4 flex-1">
                      {/* Horizontal Position */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Horizontal (Left/Right)</label>
                        <div className="flex items-center gap-2">
                          <MoveHorizontal className="w-4 h-4 text-gray-500" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={person.photo_position_x || 50}
                            onChange={(e) => handlePositionChange(person.id, Number(e.target.value), person.photo_position_y || 50, person.photo_zoom)}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-600 w-8">{person.photo_position_x || 50}%</span>
                        </div>
                      </div>

                      {/* Vertical Position */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Vertical (Up/Down)</label>
                        <div className="flex items-center gap-2">
                          <MoveVertical className="w-4 h-4 text-gray-500" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={person.photo_position_y || 50}
                            onChange={(e) => handlePositionChange(person.id, person.photo_position_x || 50, Number(e.target.value), person.photo_zoom)}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-600 w-8">{person.photo_position_y || 50}%</span>
                        </div>
                      </div>

                      {/* Zoom */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Zoom Level</label>
                        <div className="flex items-center gap-2">
                          <ZoomIn className="w-4 h-4 text-gray-500" />
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={person.photo_zoom || 1}
                            onChange={(e) => handlePositionChange(person.id, person.photo_position_x || 50, person.photo_position_y || 50, Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-600 w-8">{(person.photo_zoom || 1).toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">
                  {person.first_name} {person.last_name}
                </h3>
                {person.position_name && (
                  <p className="text-sm text-gray-600 mt-1">{person.position_name}</p>
                )}
                <button
                  onClick={() => handleDelete(person)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Crop Modal */}
      {cropModalOpen && imagePreviewUrl && (
        <PhotoCropModal
          imageUrl={imagePreviewUrl}
          onCropComplete={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </div>
  );
}
