import { MapPin, Check } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useState, useRef, useEffect } from 'react';

export default function LocationSelector() {
  const { locations, selectedLocation, setSelectedLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (locations.length === 0 || !selectedLocation) {
    return null;
  }

  // If there's only one location, don't show the selector
  if (locations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <MapPin className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">{selectedLocation.display_name}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <MapPin className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">{selectedLocation.display_name}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
              Select Location
            </div>
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => {
                  setSelectedLocation(location);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedLocation.id === location.id
                    ? 'bg-primary text-white'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{location.display_name}</span>
                  {location.is_primary && (
                    <span
                      className={`text-xs ${
                        selectedLocation.id === location.id ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      Primary
                    </span>
                  )}
                </div>
                {selectedLocation.id === location.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
