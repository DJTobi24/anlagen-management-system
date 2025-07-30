import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AufnahmenList from './pages/AufnahmenList';
import AnlagenList from './pages/AnlagenList';
import AnlageDetail from './pages/AnlageDetail';
import AnlageCreate from './pages/AnlageCreate';
import SyncPage from './pages/SyncPage';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import SyncIndicator from './components/SyncIndicator';
import InstallPrompt from './components/InstallPrompt';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <SyncIndicator />
      <InstallPrompt />
      
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/aufnahmen" /> : <Login />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/aufnahmen" /> : <Navigate to="/login" />
        } />
        
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/aufnahmen" element={<AufnahmenList />} />
          <Route path="/aufnahmen/:aufnahmeId" element={<AnlagenList />} />
          <Route path="/aufnahmen/:aufnahmeId/anlagen/neu" element={<AnlageCreate />} />
          <Route path="/aufnahmen/:aufnahmeId/anlagen/:anlageId" element={<AnlageDetail />} />
          <Route path="/sync" element={<SyncPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <AuthProvider>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;