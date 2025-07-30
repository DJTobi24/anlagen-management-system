import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          console.log('User data from API:', userData); // Debug log
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('auth_token');
          console.error('Auth initialization failed:', error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      // Get user data after successful login
      const userData = await authService.getCurrentUser();
      console.log('User data after login:', userData); // Debug log
      setUser(userData);
      
      toast.success('Erfolgreich angemeldet!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Anmeldung fehlgeschlagen');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.success('Erfolgreich abgemeldet');
  };
  
  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        console.log('Refreshed user data:', userData); // Debug log
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};