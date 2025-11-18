import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Display from './pages/Display';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';
import Positions from './pages/admin/Positions';
import People from './pages/admin/People';
import Microphones from './pages/admin/Microphones';
import Setlist from './pages/admin/Setlist';
import Locations from './pages/admin/Locations';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Display />} />
        <Route path="/location/:slug" element={<Display />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="positions" element={<Positions />} />
          <Route path="people" element={<People />} />
          <Route path="microphones" element={<Microphones />} />
          <Route path="setlist" element={<Setlist />} />
          <Route path="locations" element={<Locations />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
