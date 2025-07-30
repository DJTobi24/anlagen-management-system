import { api } from './api';
import { Anlage, PaginatedResponse, Statistics, ApiResponse } from '../types';

export const anlageService = {
  async getAnlagen(params?: {
    search?: string;
    status?: string;
    aks_code?: string;
  }): Promise<Anlage[]> {
    const response = await api.get<ApiResponse<Anlage[]>>('/anlagen', { params });
    return response.data.data;
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
    // Transform field names to match backend expectations
    const transformedData: any = {};
    if (data.t_nummer !== undefined) transformedData.tNummer = data.t_nummer;
    if (data.aks_code !== undefined) transformedData.aksCode = data.aks_code;
    if (data.name !== undefined) transformedData.name = data.name;
    if (data.description !== undefined) transformedData.description = data.description;
    if (data.status !== undefined) transformedData.status = data.status;
    if (data.zustands_bewertung !== undefined) transformedData.zustandsBewertung = data.zustands_bewertung;
    if (data.metadaten !== undefined) transformedData.metadaten = data.metadaten;
    
    const response = await api.put<ApiResponse<Anlage>>(`/anlagen/${id}`, transformedData);
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

  async getAnlagenByObjekt(objektId: string): Promise<Anlage[]> {
    const response = await api.get<ApiResponse<Anlage[]>>('/anlagen', {
      params: { objekt_id: objektId }
    });
    return response.data.data;
  },

  async getAnlageHistory(id: string): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(`/anlagen/${id}/history`);
    return response.data.data;
  },
};

export default anlageService;