import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LocationProvider } from '../contexts/LocationContext';
import LocationSelector from './LocationSelector';
import { LayoutDashboard, Settings, Users, UserCircle, Mic, LogOut, ListMusic, MapPin } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/locations', icon: MapPin, label: 'Locations' },
    { path: '/admin/positions', icon: UserCircle, label: 'Positions' },
    { path: '/admin/people', icon: Users, label: 'People' },
    { path: '/admin/microphones', icon: Mic, label: 'Microphones' },
    { path: '/admin/setlist', icon: ListMusic, label: 'Setlist' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <LocationProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">Micboard</h1>
            <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.username}</p>
                <p className="text-gray-500">Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Location Selector */}
          <div className="bg-white border-b px-8 py-4 flex items-center justify-end">
            <LocationSelector />
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}
