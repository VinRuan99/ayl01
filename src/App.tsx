import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider } from './components/FirebaseProvider';
import { useStore } from './store/useStore';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProjects from './pages/admin/AdminProjects';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLanguages from './pages/admin/AdminLanguages';
import Login from './pages/Login';

const ProtectedRoute = ({ children, requireRoot = false }: { children: React.ReactNode, requireRoot?: boolean }) => {
  const { user, isAuthReady } = useStore();

  if (!isAuthReady) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (requireRoot && user.role !== 'root') {
    return <Navigate to="/admin" />; // Redirect sub-admin to dashboard
  }

  return <>{children}</>;
};

export default function App() {
  const { theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <FirebaseProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
            </Route>

            {/* Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="settings" element={<ProtectedRoute requireRoot><AdminSettings /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute requireRoot><AdminUsers /></ProtectedRoute>} />
              <Route path="languages" element={<ProtectedRoute requireRoot><AdminLanguages /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </FirebaseProvider>
    </div>
  );
}
