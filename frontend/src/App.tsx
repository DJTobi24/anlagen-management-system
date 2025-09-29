import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Auth/Login';
import PerfectLayout from './components/Layout/PerfectLayout';
import DataCollectionDashboard from './pages/DataCollectionDashboard';
import PerfectAnlagen from './pages/PerfectAnlagen';
import SimplifiedAnlageDetail from './pages/SimplifiedAnlageDetail';
import AnlageEdit from './pages/AnlageEdit';
import Import from './pages/Import';
import ModernSettings from './pages/ModernSettings';
import AksManagement from './pages/AksManagement';
import AnlageNew from './pages/AnlageNew';
import FMDataCollection from './pages/FMDataCollection';
import ModernLiegenschaften from './pages/ModernLiegenschaften';
import ModernObjekte from './pages/ModernObjekte';
import Reports from './pages/Reports';
import ImportReports from './pages/ImportReports';
import ModernDatenaufnahmeVerwaltung from './pages/ModernDatenaufnahmeVerwaltung';
import MeineDatenaufnahmen from './pages/MeineDatenaufnahmen';
import UserManagement from './pages/UserManagement';
import AksFieldManagement from './pages/AksFieldManagement';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={
        <ProtectedRoute>
          <PerfectLayout>
            <DataCollectionDashboard />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen" element={
        <ProtectedRoute>
          <PerfectLayout>
            <PerfectAnlagen />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/new" element={
        <ProtectedRoute>
          <PerfectLayout>
            <AnlageNew />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/:id" element={
        <ProtectedRoute>
          <PerfectLayout>
            <SimplifiedAnlageDetail />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/:id/edit" element={
        <ProtectedRoute>
          <PerfectLayout>
            <AnlageEdit />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/import" element={
        <ProtectedRoute>
          <PerfectLayout>
            <Import />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/aks" element={
        <ProtectedRoute>
          <PerfectLayout>
            <AksManagement />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/aks-fields" element={
        <ProtectedRoute>
          <PerfectLayout>
            <AksFieldManagement />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <PerfectLayout>
            {user && (user.rolle === 'admin' || user.rolle === 'system_admin') ? <UserManagement /> : <Navigate to="/" />}
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ModernSettings />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/fm-data-collection" element={
        <ProtectedRoute>
          <PerfectLayout>
            <FMDataCollection />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/liegenschaften" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ModernLiegenschaften />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/objekte" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ModernObjekte />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/liegenschaften/:liegenschaftId/objekte" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ModernObjekte />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <PerfectLayout>
            <Reports />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports/imports" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ImportReports />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/datenaufnahme" element={
        <ProtectedRoute>
          <PerfectLayout>
            <ModernDatenaufnahmeVerwaltung />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="/meine-datenaufnahmen" element={
        <ProtectedRoute>
          <PerfectLayout>
            <MeineDatenaufnahmen />
          </PerfectLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;