import { api } from './api';
import { Anlage, PaginatedResponse, Statistics, ApiResponse } from '../types';

export const anlageService = {
  async getAnlagen(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    aks_code?: string;
  }): Promise<PaginatedResponse<Anlage>> {
    const response = await api.get<PaginatedResponse<Anlage>>('/anlagen', { params });
    return response.data;
  },

  async getAnlage(id: string): Promise<Anlage> {
    const response = await api.get<ApiResponse<Anlage>>(`/anlagen/${id}`);
    return response.data.data;
  },

  async createAnlage(data: Partial<Anlage>): Promise<Anlage> {
    const response = await api.post<ApiResponse<Anlage>>('/anlagen', data);
    return response.data.data;
  },

  async updateAnlage(id: string, data: Partial<Anlage>): Promise<Anlage> {
    const response = await api.put<ApiResponse<Anlage>>(`/anlagen/${id}`, data);
    return response.data.data;
  },

  async deleteAnlage(id: string): Promise<void> {
    await api.delete(`/anlagen/${id}`);
  },

  async getStatistics(): Promise<Statistics> {
    const response = await api.get<ApiResponse<Statistics>>('/anlagen/statistics');
    return response.data.data;
  },

  async getWartungFaellig(): Promise<Anlage[]> {
    const response = await api.get<ApiResponse<Anlage[]>>('/anlagen/wartung/faellig');
    return response.data.data;
  },

  async searchAnlagen(query: string): Promise<Anlage[]> {
    const response = await api.get<ApiResponse<Anlage[]>>('/anlagen/search', {
      params: { q: query }
    });
    return response.data.data;
  },
};