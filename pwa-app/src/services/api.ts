import axios, { AxiosInstance } from 'axios';
import { db } from '../db/database';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isOffline: boolean = !navigator.onLine;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Source': 'pwa',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!error.response && error.code === 'ECONNABORTED') {
          // Timeout or network error
          this.isOffline = true;
          await db.updateOfflineState(false);
        }

        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Don't redirect immediately to avoid interrupting data flow
          // The AuthContext will handle the redirect
        }

        return Promise.reject(error);
      }
    );

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      db.updateOfflineState(true);
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      db.updateOfflineState(false);
    });
  }

  // Auth methods
  async login(email: string, password: string): Promise<any> {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.data?.accessToken) {
      localStorage.setItem('auth_token', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      }
      
      // Nach erfolgreichem Login hole User-Daten
      try {
        const userResponse = await this.client.get('/auth/me');
        const userData = userResponse.data.data || userResponse.data;
        localStorage.setItem('user', JSON.stringify(userData));
        return {
          ...response.data.data,
          user: userData
        };
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        return response.data.data;
      }
    }
    return response.data.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    await db.clearAllData();
  }

  // Generic methods with offline fallback
  async get(url: string, options?: any): Promise<any> {
    try {
      const response = await this.client.get(url, options);
      // Ensure we have valid data
      if (!response) {
        console.error('No response from API');
        return [];
      }
      
      // Return the actual data
      const data = response.data;
      console.log(`API GET ${url} response:`, data);
      
      // If data is undefined or null, return empty array
      if (data === undefined || data === null) {
        console.log('API returned undefined/null, using empty array');
        return [];
      }
      
      return data;
    } catch (error: any) {
      console.error(`API GET ${url} failed:`, error);
      
      if (this.isOffline || !navigator.onLine) {
        // Try to return cached data
        if (url.includes('/datenaufnahme/meine-auftraege') || (url.includes('/datenaufnahme') && url.includes('zugewiesen_an'))) {
          const cached = await db.getCachedAuftraege();
          return cached || [];
        }
        throw new Error('Offline - No cached data available');
      }
      
      // For 401 errors, return empty array instead of throwing
      if (error.response?.status === 401) {
        return [];
      }
      
      throw error;
    }
  }

  async post(url: string, data: any, options?: any): Promise<any> {
    if (this.isOffline || !navigator.onLine) {
      // Queue for later sync
      if (url.includes('/anlagen/') && url.includes('/bearbeitet')) {
        const matches = url.match(/\/datenaufnahme\/(.+)\/anlagen\/(.+)\/bearbeitet/);
        if (matches) {
          await db.markAnlageBearbeitetLocally(matches[1], matches[2], data);
          return { success: true, offline: true };
        }
      }
      throw new Error('Offline - Action queued for sync');
    }

    const response = await this.client.post(url, data, options);
    return response.data;
  }

  async put(url: string, data: any, options?: any): Promise<any> {
    if (this.isOffline || !navigator.onLine) {
      // Queue for later sync
      if (url.includes('/anlagen/')) {
        const anlageId = url.split('/').pop();
        if (anlageId) {
          await db.updateAnlageLocally(anlageId, data);
          return { success: true, offline: true };
        }
      }
      throw new Error('Offline - Action queued for sync');
    }

    const response = await this.client.put(url, data, options);
    return response.data;
  }

  async delete(url: string, options?: any): Promise<any> {
    if (this.isOffline || !navigator.onLine) {
      throw new Error('Offline - Delete operations not supported offline');
    }

    const response = await this.client.delete(url, options);
    return response.data;
  }

  // Check if online
  isOnline(): boolean {
    return !this.isOffline && navigator.onLine;
  }
}

export const apiClient = new ApiClient();