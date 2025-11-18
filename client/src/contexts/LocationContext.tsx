import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '../services/api';
import type { Location } from '../types';

interface LocationContextType {
  locations: Location[];
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location) => void;
  loading: boolean;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const data = await adminAPI.getLocations();
      setLocations(data);

      // If no location is selected, select the primary location or the first one
      if (!selectedLocation && data.length > 0) {
        const primary = data.find(l => l.is_primary) || data[0];
        setSelectedLocationState(primary);
        localStorage.setItem('selectedLocationId', primary.id.toString());
      } else if (selectedLocation) {
        // Update the selected location with fresh data
        const updated = data.find(l => l.id === selectedLocation.id);
        if (updated) {
          setSelectedLocationState(updated);
        } else if (data.length > 0) {
          // Selected location was deleted, switch to primary or first
          const primary = data.find(l => l.is_primary) || data[0];
          setSelectedLocationState(primary);
          localStorage.setItem('selectedLocationId', primary.id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Restore selected location from localStorage on mount
  useEffect(() => {
    const storedLocationId = localStorage.getItem('selectedLocationId');
    if (storedLocationId && locations.length > 0) {
      const location = locations.find(l => l.id === parseInt(storedLocationId));
      if (location) {
        setSelectedLocationState(location);
      }
    }
  }, [locations]);

  const setSelectedLocation = (location: Location) => {
    setSelectedLocationState(location);
    localStorage.setItem('selectedLocationId', location.id.toString());
  };

  const refreshLocations = async () => {
    await fetchLocations();
  };

  return (
    <LocationContext.Provider
      value={{
        locations,
        selectedLocation,
        setSelectedLocation,
        loading,
        refreshLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
