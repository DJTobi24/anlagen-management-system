import api from './api';

export interface Liegenschaft {
  id: string;
  mandant_id: string;
  name: string;
  adresse?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class LiegenschaftService {
  async getLiegenschaften(): Promise<Liegenschaft[]> {
    const response = await api.get('/liegenschaften');
    return response.data;
  }

  async getLiegenschaft(id: string): Promise<Liegenschaft> {
    const response = await api.get(`/liegenschaften/${id}`);
    return response.data;
  }

  async createLiegenschaft(data: Partial<Liegenschaft>): Promise<Liegenschaft> {
    const response = await api.post('/liegenschaften', data);
    return response.data;
  }

  async updateLiegenschaft(id: string, data: Partial<Liegenschaft>): Promise<Liegenschaft> {
    const response = await api.put(`/liegenschaften/${id}`, data);
    return response.data;
  }

  async deleteLiegenschaft(id: string): Promise<void> {
    await api.delete(`/liegenschaften/${id}`);
  }
}

export default new LiegenschaftService();