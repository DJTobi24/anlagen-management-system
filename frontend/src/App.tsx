import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Anlagen from './pages/Anlagen';
import AnlageDetail from './pages/AnlageDetail';
import Import from './pages/Import';
import Users from './pages/Users';
import Settings from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/anlagen" element={<Anlagen />} />
        <Route path="/anlagen/:id" element={<AnlageDetail />} />
        <Route path="/import" element={<Import />} />
        {(user.rolle === 'admin' || user.rolle === 'manager') && (
          <>
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
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