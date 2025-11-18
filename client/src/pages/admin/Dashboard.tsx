import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCircle, Mic, Settings as SettingsIcon } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';

export default function Dashboard() {
  const { selectedLocation } = useLocation();
  const [stats, setStats] = useState({
    people: 0,
    positions: 0,
    microphones: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedLocation) return;

      try {
        const [people, positions, microphones] = await Promise.all([
          adminAPI.getPeople(selectedLocation.id),
          adminAPI.getPositions(selectedLocation.id),
          adminAPI.getMicrophones(selectedLocation.id),
        ]);
        setStats({
          people: people.length,
          positions: positions.filter((p: any) => p.sync_enabled).length,
          microphones: microphones.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedLocation]);

  const statCards = [
    {
      title: 'People Synced',
      value: stats.people,
      icon: Users,
      link: '/admin/people',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Positions',
      value: stats.positions,
      icon: UserCircle,
      link: '/admin/positions',
      color: 'bg-green-500',
    },
    {
      title: 'Microphones',
      value: stats.microphones,
      icon: Mic,
      link: '/admin/microphones',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Micboard admin panel</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.link}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/admin/settings"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
              >
                <SettingsIcon className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Configure Settings</p>
                  <p className="text-sm text-gray-600">Set up Planning Center integration</p>
                </div>
              </Link>
              <Link
                to="/admin/people"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
              >
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Sync People</p>
                  <p className="text-sm text-gray-600">Import from Planning Center</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Display Preview Link */}
          <div className="mt-8 bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-lg text-white">
            <h2 className="text-xl font-semibold mb-2">Public Display</h2>
            <p className="mb-4">View how the display will appear to your congregation</p>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Open Display View
            </a>
          </div>
        </>
      )}
    </div>
  );
}
