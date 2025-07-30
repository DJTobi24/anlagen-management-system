import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Anlagen from './pages/Anlagen';
import AnlageDetail from './pages/AnlageDetail';
import AnlageEdit from './pages/AnlageEdit';
import Import from './pages/Import';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AksManagement from './pages/AksManagement';
import AnlageNew from './pages/AnlageNew';
import FMDataCollection from './pages/FMDataCollection';
import Liegenschaften from './pages/Liegenschaften';
import Objekte from './pages/Objekte';
import Reports from './pages/Reports';
import ImportReports from './pages/ImportReports';
import DatenaufnahmeVerwaltung from './pages/DatenaufnahmeVerwaltung';
import MeineDatenaufnahmen from './pages/MeineDatenaufnahmen';

// ProtectedRoute component for future use
// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { user, loading } = useAuth();
//   
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }
//   
//   return user ? <>{children}</> : <Navigate to="/login" />;
// };

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
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen" element={
        <ProtectedRoute>
          <Layout>
            <Anlagen />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/new" element={
        <ProtectedRoute>
          <Layout>
            <AnlageNew />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/:id" element={
        <ProtectedRoute>
          <Layout>
            <AnlageDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/anlagen/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <AnlageEdit />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/import" element={
        <ProtectedRoute>
          <Layout>
            <Import />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/aks" element={
        <ProtectedRoute>
          <Layout>
            <AksManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Layout>
            {user && user.rolle === 'admin' ? <Users /> : <Navigate to="/" />}
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/fm-data-collection" element={
        <ProtectedRoute>
          <Layout>
            <FMDataCollection />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/liegenschaften" element={
        <ProtectedRoute>
          <Layout>
            <Liegenschaften />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/objekte" element={
        <ProtectedRoute>
          <Layout>
            <Objekte />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/liegenschaften/:liegenschaftId/objekte" element={
        <ProtectedRoute>
          <Layout>
            <Objekte />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports/imports" element={
        <ProtectedRoute>
          <Layout>
            <ImportReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/datenaufnahme" element={
        <ProtectedRoute>
          <Layout>
            <DatenaufnahmeVerwaltung />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/meine-datenaufnahmen" element={
        <ProtectedRoute>
          <Layout>
            <MeineDatenaufnahmen />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

export default App;