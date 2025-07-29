import { api } from './api';
import { AksCode, AksImportResult, AksSearchParams } from '../types/aks';
import { ApiResponse } from '../types';

export const aksService = {
  // Search AKS codes
  searchAksCodes: async (params: AksSearchParams): Promise<{ data: { codes: AksCode[], pagination: any } }> => {
    // Filter out empty string parameters
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key as keyof AksSearchParams] = value;
      }
      return acc;
    }, {} as AksSearchParams);
    
    const response = await api.get<ApiResponse<{ codes: AksCode[], pagination: any }>>('/aks/search', { params: cleanParams });
    return response.data;
  },

  // Get single AKS code
  getAksCode: async (code: string): Promise<{ data: AksCode }> => {
    const response = await api.get<ApiResponse<AksCode>>(`/aks/code/${encodeURIComponent(code)}`);
    return response.data;
  },

  // Create AKS code
  createAksCode: async (data: Partial<AksCode>): Promise<{ data: AksCode }> => {
    const response = await api.post<ApiResponse<AksCode>>('/aks/codes', data);
    return response.data;
  },

  // Update AKS code
  updateAksCode: async (id: string, data: Partial<AksCode>): Promise<{ data: AksCode }> => {
    const response = await api.put<ApiResponse<AksCode>>(`/aks/codes/${id}`, data);
    return response.data;
  },

  // Delete AKS code
  deleteAksCode: async (id: string): Promise<void> => {
    await api.delete(`/aks/codes/${id}`);
  },

  // Toggle AKS code status (activate/deactivate)
  toggleAksCodeStatus: async (id: string): Promise<{ data: AksCode }> => {
    const response = await api.patch<ApiResponse<AksCode>>(`/aks/codes/${id}/toggle`);
    return response.data;
  },

  // Bulk operations
  bulkDeleteAksCodes: async (ids: string[]): Promise<{ data: any }> => {
    const response = await api.post<ApiResponse<any>>('/aks/codes/bulk/delete', { ids });
    return response.data;
  },

  bulkToggleAksCodesStatus: async (ids: string[], isActive: boolean): Promise<{ data: any }> => {
    const response = await api.post<ApiResponse<any>>('/aks/codes/bulk/toggle', { ids, isActive });
    return response.data;
  },

  bulkUpdateAksCodes: async (ids: string[], updateData: any): Promise<{ data: any }> => {
    const response = await api.post<ApiResponse<any>>('/aks/codes/bulk/update', { ids, updateData });
    return response.data;
  },

  // Get categories
  getCategories: async (): Promise<Array<{ value: string, label: string }>> => {
    const response = await api.get<ApiResponse<Array<{ value: string, label: string }>>>('/aks/categories');
    return response.data.data;
  },

  // Get field types
  getFieldTypes: async (): Promise<Array<{ value: string, label: string }>> => {
    const response = await api.get<ApiResponse<Array<{ value: string, label: string }>>>('/aks/field-types');
    return response.data.data;
  },

  // Get data types
  getDataTypes: async (): Promise<Array<{ value: string, label: string }>> => {
    const response = await api.get<ApiResponse<Array<{ value: string, label: string }>>>('/aks/data-types');
    return response.data.data;
  },

  // Import from Excel
  importFromExcel: async (file: File): Promise<AksImportResult> => {
    const formData = new FormData();
    formData.append('excel', file);

    const response = await api.post<ApiResponse<AksImportResult>>('/aks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  // Download import template
  downloadImportTemplate: async (): Promise<Blob> => {
    const response = await api.get('/aks/import/template', {
      responseType: 'blob',
    });

    return response.data;
  },

  // Download error report
  downloadErrorReport: async (errors: any[]): Promise<Blob> => {
    const response = await api.post('/aks/import/error-report', { errors }, {
      responseType: 'blob',
    });

    return response.data;
  },

  // Get field mapping for AKS code
  getFieldMapping: async (code: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/aks/code/${encodeURIComponent(code)}/mapping`);
    return response.data;
  },

  // Get AKS tree (hierarchical structure based on code pattern)
  getAksTree: async (parentCode?: string): Promise<AksCode[]> => {
    let url = '/aks/tree';
    if (parentCode) {
      // Get children of a specific code
      url += `?parentCode=${encodeURIComponent(parentCode)}`;
    } else {
      // Get only top-level codes (AKS.XX)
      url += '?level=1';
    }
    const response = await api.get<ApiResponse<AksCode[]>>(url);
    return response.data.data;
  },

  // Validate AKS fields
  validateFields: async (data: { aksCode: string, fieldValues: any[] }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/aks/validate', data);
    return response.data;
  },

  // Import AKS codes from Excel
  importAksFromExcel: async (file: File): Promise<{ data: { success: number; failed: number; errors: any[] } }> => {
    const formData = new FormData();
    formData.append('excel', file);
    
    const response = await api.post<ApiResponse<{ success: number; failed: number; errors: any[] }>>(
      '/aks/codes/import', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Download AKS import template
  downloadAksImportTemplate: async (): Promise<Blob> => {
    const response = await api.get('/aks/codes/import/template', {
      responseType: 'blob',
    });
    return response.data;
  }
};