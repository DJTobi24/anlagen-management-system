import { api } from './api';
import { ImportJob, ApiResponse } from '../types';

export const importService = {
  async uploadFile(file: File): Promise<ImportJob> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ApiResponse<ImportJob>>('/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getImportStatus(jobId: string): Promise<ImportJob> {
    const response = await api.get<ApiResponse<ImportJob>>(`/import/status/${jobId}`);
    return response.data.data;
  },

  async getImportJobs(): Promise<ImportJob[]> {
    try {
      const response = await api.get<ApiResponse<ImportJob[]>>('/import/jobs');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      return [];
    }
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/import/sample/excel', {
      responseType: 'blob',
    });
    return response.data;
  },

  async cancelImport(jobId: string): Promise<void> {
    await api.post(`/import/cancel/${jobId}`);
  },

  async uploadExtendedFile(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
    createdLiegenschaften: number;
    createdGebaeude: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ApiResponse<{
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
      createdLiegenschaften: number;
      createdGebaeude: number;
    }>>('/import/upload/extended', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};