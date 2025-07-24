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
    const response = await api.get<ApiResponse<ImportJob[]>>('/import/jobs');
    return response.data.data;
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/import/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  async cancelImport(jobId: string): Promise<void> {
    await api.post(`/import/cancel/${jobId}`);
  },
};