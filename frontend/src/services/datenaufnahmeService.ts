import api from './api';
import { 
  DatenaufnahmeAuftrag, 
  CreateDatenaufnahmeDto, 
  UpdateDatenaufnahmeDto,
  DatenaufnahmeFilter,
  DatenaufnahmeFortschritt 
} from '../types/datenaufnahme';

class DatenaufnahmeService {
  // Alle Datenaufnahmen abrufen
  async getDatenaufnahmen(filter?: DatenaufnahmeFilter): Promise<DatenaufnahmeAuftrag[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.zugewiesen_an) params.append('zugewiesen_an', filter.zugewiesen_an);
    if (filter?.erstellt_von) params.append('erstellt_von', filter.erstellt_von);
    
    const response = await api.get(`/datenaufnahme?${params.toString()}`);
    return response.data;
  }

  // Einzelne Datenaufnahme abrufen
  async getDatenaufnahme(id: string): Promise<DatenaufnahmeAuftrag> {
    const response = await api.get(`/datenaufnahme/${id}`);
    return response.data;
  }

  // Neue Datenaufnahme erstellen
  async createDatenaufnahme(data: CreateDatenaufnahmeDto): Promise<DatenaufnahmeAuftrag> {
    const response = await api.post('/datenaufnahme', data);
    return response.data.data;
  }

  // Datenaufnahme aktualisieren
  async updateDatenaufnahme(id: string, data: UpdateDatenaufnahmeDto): Promise<DatenaufnahmeAuftrag> {
    const response = await api.put(`/datenaufnahme/${id}`, data);
    return response.data;
  }

  // Anlagen-Konfiguration aktualisieren
  async updateAnlagenConfig(id: string, anlagen_config: any[]): Promise<void> {
    await api.put(`/datenaufnahme/${id}/anlagen-config`, { anlagen_config });
  }

  // Anlage als bearbeitet markieren
  async markAnlageBearbeitet(
    aufnahmeId: string, 
    anlageId: string, 
    data: { 
      notizen?: string; 
      alte_werte?: any; 
      neue_werte?: any; 
    }
  ): Promise<void> {
    await api.post(`/datenaufnahme/${aufnahmeId}/anlage/${anlageId}/bearbeitet`, data);
  }

  // Datenaufnahme löschen
  async deleteDatenaufnahme(id: string): Promise<void> {
    await api.delete(`/datenaufnahme/${id}`);
  }

  // Fortschritt abrufen
  async getDatenaufnahmeFortschritt(id: string): Promise<DatenaufnahmeFortschritt[]> {
    const response = await api.get(`/datenaufnahme/${id}/fortschritt`);
    return response.data;
  }

  // Verfügbare Mitarbeiter abrufen
  async getVerfuegbareMitarbeiter(): Promise<any[]> {
    const response = await api.get('/users');
    // Die API gibt { data: users } zurück, wir brauchen nur das Array
    const users = response.data.data || response.data;
    // Filtere nach Mitarbeitern (role kann 'mitarbeiter', 'supervisor', oder 'admin' sein)
    return Array.isArray(users) ? users : [];
  }
}

export default new DatenaufnahmeService();