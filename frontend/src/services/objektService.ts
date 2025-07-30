import api from './api';

export interface Objekt {
  id: string;
  liegenschaft_id: string;
  name: string;
  description?: string;
  floor?: string;
  room?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class ObjektService {
  async getObjekte(): Promise<Objekt[]> {
    const response = await api.get('/objekte');
    return response.data;
  }

  async getObjekt(id: string): Promise<Objekt> {
    const response = await api.get(`/objekte/${id}`);
    return response.data;
  }

  async getObjekteByLiegenschaft(liegenschaftId: string): Promise<Objekt[]> {
    const response = await api.get(`/objekte?liegenschaft_id=${liegenschaftId}`);
    return response.data;
  }

  async createObjekt(data: Partial<Objekt>): Promise<Objekt> {
    const response = await api.post('/objekte', data);
    return response.data;
  }

  async updateObjekt(id: string, data: Partial<Objekt>): Promise<Objekt> {
    const response = await api.put(`/objekte/${id}`, data);
    return response.data;
  }

  async deleteObjekt(id: string): Promise<void> {
    await api.delete(`/objekte/${id}`);
  }
}

export default new ObjektService();