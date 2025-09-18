import { api } from './api';
import { User, ApiResponse } from '../types';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string, totpCode?: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/auth/login', {
      email,
      password,
      totpCode,
    });
    return response.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // MFA Features (works with both legacy and enterprise)
  async setupMfa(method: 'totp' | 'webauthn'): Promise<any> {
    const response = await api.post(`/mfa/setup`, { method });
    return response.data.data;
  },

  async verifyMfa(code: string): Promise<any> {
    const response = await api.post(`/mfa/verify-setup`, { token: code });
    return response.data.data;
  },

  async getMfaStatus(): Promise<any> {
    const response = await api.get(`/mfa/status`);
    return response.data.data;
  },

};