import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/login';
import Register from './pages/register';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard';
import Tasks from './pages/tasks';
import Projects from './pages/projects';
import Profile from './pages/profile';
import CalendarPage from './pages/CalendarPage';
import Settings from './pages/Settings'; // Tambahkan ini di atas

// Komponen pelindung: Jika belum login, tendang ke halaman /login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Sama untuk mencegah user yg sudah login balik ke halaman login
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

// Root redirect: landing untuk guest, dashboard untuk yang sudah login
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Halaman Utama (Landing Page) */}
      <Route path="/" element={<RootRedirect />} />

      {/* Route Public (Hanya bisa diakses kalau belum login) */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Route Private (Harus login, dibungkus oleh Sidebar Layout) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<CalendarPage />} />
        {/* Nanti kita buat halaman ini */}
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}