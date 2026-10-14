import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import SegmentationStudioPage from './pages/SegmentationStudioPage';
import DatasetsPage from './pages/DatasetsPage';
import ReportsPage from './pages/ReportsPage';
import CampaignsPage from './pages/CampaignsPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import HelpDocsPage from './pages/HelpDocsPage';
import NotFoundPage from './pages/NotFoundPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement; requiredAdmin?: boolean }> = ({
  children,
  requiredAdmin = false
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Authenticating session...
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin is required and user is not admin
  if (requiredAdmin && !isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="segmentation" element={<SegmentationStudioPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpDocsPage />} />
          </Route>

          {/* Errors */}
          <Route path="/403" element={<AccessDeniedPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
