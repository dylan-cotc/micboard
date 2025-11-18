import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { displayAPI } from '../services/api';
import type { DisplayData } from '../types';
import PersonCard from '../components/PersonCard';
import SetlistItem from '../components/SetlistItem';

export default function Display() {
  const { slug } = useParams<{ slug?: string }>();
  const [data, setData] = useState<DisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const displayData = await displayAPI.getData(slug);
        setData(displayData);
      } catch (error) {
        console.error('Error fetching display data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-4xl">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-4xl">Error loading display data</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    // Parse the date string as local time to avoid timezone offset issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date, timezone: string) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const logoUrl = data.logo?.path ? `${API_BASE_URL}/../${data.logo.path}` : null;

  // Color schemes based on dark mode
  const bgGradient = data.dark_mode
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
    : 'bg-gradient-to-br from-gray-100 via-white to-gray-200';
  const headerBg = data.dark_mode
    ? 'bg-gray-800 bg-opacity-50'
    : 'bg-white bg-opacity-80';
  const textColor = data.dark_mode ? 'text-white' : 'text-gray-900';
  const textSecondary = data.dark_mode ? 'text-gray-300' : 'text-gray-600';
  const cardBg = data.dark_mode
    ? 'bg-gray-800 bg-opacity-50'
    : 'bg-white bg-opacity-80';

  return (
    <div className={`min-h-screen ${bgGradient} flex flex-col`}>
      {/* Header Bar */}
      <header className={`${headerBg} backdrop-blur-sm shadow-lg px-8 py-6 relative flex items-center`}>
        {/* Logo and/or Church Name */}
        <div className={`flex items-center gap-6 ${
          data.logo?.display_mode === 'both' && data.logo?.position === 'center' ? 'absolute left-1/2 -translate-x-1/2' : ''
        } ${
          data.logo?.display_mode === 'logo_only' || data.logo?.display_mode === 'church_only' ? 'absolute left-1/2 -translate-x-1/2' : ''
        }`}>
          {/* Show logo if mode is logo_only or both */}
          {logoUrl && (data.logo?.display_mode === 'logo_only' || data.logo?.display_mode === 'both') && (
            <img
              src={logoUrl}
              alt="Church Logo"
              className="h-20 object-contain"
            />
          )}
          {/* Show church name if mode is church_only or both */}
          {(data.logo?.display_mode === 'church_only' || data.logo?.display_mode === 'both') && (
            <div className={textColor}>
              <h1 className="text-4xl font-bold">{data.churchName}</h1>
            </div>
          )}
        </div>

        {/* Date and Time - always show in top right */}
        <div className={`${textColor} text-right ml-auto`}>
          <p className="text-3xl font-semibold">{formatDate(data.date)}</p>
          <p className={`text-2xl ${textSecondary} mt-1`}>{formatTime(currentTime, data.timezone)}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        {/* People Columns - Tall vertical columns with max 9 across (2:5 ratio) */}
        <div className="mb-8" style={{ height: 'calc(100vh - 360px)' }}>
          {data.displayItems && data.displayItems.length > 0 ? (
            <div className="flex gap-6 h-full justify-center items-stretch">
              {data.displayItems.map((item, index) => {
                if (item.type === 'separator') {
                  return (
                    <div key={`separator-${index}`} className="flex items-center px-2">
                      <div className={`h-3/4 w-0.5 ${data.dark_mode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    </div>
                  );
                }
                // Person item
                const person = {
                  id: item.id!,
                  pc_person_id: '',
                  first_name: item.first_name!,
                  last_name: item.last_name!,
                  photo_path: item.photo_path || null,
                  photo_position_x: item.photo_position_x,
                  photo_position_y: item.photo_position_y,
                  photo_zoom: item.photo_zoom,
                  position_id: null,
                  position_name: item.position_name || null,
                  location_id: 0
                };
                const peopleCount = data.displayItems.filter(i => i.type === 'person').length;
                return (
                  <div
                    key={person.id}
                    className="h-full"
                    style={{
                      aspectRatio: '2/5',
                      maxWidth: `calc((100vw - ${Math.min(peopleCount, 9) * 24}px) / ${Math.min(peopleCount, 9)})`
                    }}
                  >
                    <PersonCard person={person} />
                  </div>
                );
              })}
            </div>
          ) : data.people.length > 0 ? (
            <div className="flex gap-6 h-full justify-center">
              {data.people.slice(0, 9).map((person) => (
                <div
                  key={person.id}
                  className="h-full"
                  style={{
                    aspectRatio: '2/5',
                    maxWidth: `calc((100vw - ${Math.min(data.people.length, 9) * 24}px) / ${Math.min(data.people.length, 9)})`
                  }}
                >
                  <PersonCard person={person} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className={`${textColor} text-3xl`}>No people scheduled for this Sunday</p>
            </div>
          )}
        </div>

        {/* Setlist Section (Bottom) */}
        {data.setlist && data.setlist.items.length > 0 && (
          <div className={`${cardBg} backdrop-blur-sm rounded-lg shadow-xl p-6`}>
            <h2 className={`${textColor} text-2xl font-bold mb-2`}>Today's Service</h2>
            {data.setlist.title && (
              <h3 className={`${data.dark_mode ? 'text-primary-300' : 'text-primary-700'} text-xl mb-4`}>{data.setlist.title}</h3>
            )}
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {data.setlist.items.map((item, index) => (
                <div key={index} className={textColor}>
                  <SetlistItem item={item} darkMode={data.dark_mode} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
