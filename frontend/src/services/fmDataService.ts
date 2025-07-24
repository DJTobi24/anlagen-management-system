import { api } from './api';

export interface Liegenschaft {
  id: string;
  name: string;
  building_count: number;
  anlage_count: number;
}

export interface Building {
  id: string;
  name: string;
  anlage_count: number;
}

export interface AksTreeNode {
  id: string;
  code: string;
  name: string;
  description?: string;
  level: number;
  parent_code?: string;
  is_category: boolean;
  has_children: boolean;
  direct_anlage_count: number;
  total_anlage_count: number;
  maintenance_interval_months?: number;
  children: AksTreeNode[];
}

export interface AnlageInFM {
  id: string;
  name: string;
  t_nummer?: string;
  aks_code: string;
  description?: string;
  status: string;
  zustands_bewertung: number;
  qr_code?: string;
  dynamic_fields?: Record<string, any>;
  aks_name: string;
  maintenance_interval_months?: number;
}

class FMDataService {
  async getLiegenschaften(): Promise<Liegenschaft[]> {
    try {
      const response = await api.get('/fm-data/liegenschaften');
      return response.data;
    } catch (error) {
      console.error('Error fetching liegenschaften:', error);
      throw error;
    }
  }

  async getBuildings(liegenschaftId: string): Promise<Building[]> {
    try {
      const response = await api.get(`/fm-data/liegenschaften/${liegenschaftId}/buildings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }

  async getAksTreeForBuilding(buildingId: string): Promise<AksTreeNode[]> {
    try {
      const response = await api.get(`/fm-data/buildings/${buildingId}/aks-tree`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AKS tree:', error);
      throw error;
    }
  }

  async getAnlagenForAks(buildingId: string, aksCode: string): Promise<AnlageInFM[]> {
    try {
      const response = await api.get(`/fm-data/buildings/${buildingId}/aks/${aksCode}/anlagen`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anlagen:', error);
      throw error;
    }
  }
}

export default new FMDataService();