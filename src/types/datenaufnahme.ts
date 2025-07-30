// Types for Datenaufnahme (Data Collection) Preparation System

export interface DatenaufnahmeAuftrag {
  id: string;
  mandant_id: string;
  titel: string;
  beschreibung?: string;
  erstellt_von: string;
  zugewiesen_an: string;
  status: 'vorbereitet' | 'in_bearbeitung' | 'abgeschlossen' | 'pausiert';
  start_datum?: Date;
  end_datum?: Date;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  
  // Beziehungen
  ersteller?: User;
  mitarbeiter?: User;
  liegenschaften?: Liegenschaft[];
  objekte?: Objekt[];
  anlagen?: DatenaufnahmeAnlage[];
  fortschritt?: DatenaufnahmeFortschritt[];
}

export interface DatenaufnahmeAnlage {
  id: string;
  aufnahme_id: string;
  anlage_id: string;
  sichtbar: boolean;
  such_modus: boolean;
  notizen?: string;
  bearbeitet: boolean;
  bearbeitet_am?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Beziehung
  anlage?: Anlage;
}

export interface DatenaufnahmeFortschritt {
  id: string;
  aufnahme_id: string;
  anlage_id: string;
  aktion: string;
  alte_werte?: any;
  neue_werte?: any;
  benutzer_id: string;
  created_at: Date;
  
  // Beziehungen
  anlage?: Anlage;
  benutzer?: User;
}

export interface CreateDatenaufnahmeDto {
  titel: string;
  beschreibung?: string;
  zugewiesen_an: string;
  start_datum?: string;
  end_datum?: string;
  liegenschaft_ids?: string[];
  objekt_ids?: string[];
  anlagen_config?: {
    anlage_id: string;
    sichtbar: boolean;
    such_modus: boolean;
    notizen?: string;
  }[];
}

export interface UpdateDatenaufnahmeDto {
  titel?: string;
  beschreibung?: string;
  zugewiesen_an?: string;
  status?: 'vorbereitet' | 'in_bearbeitung' | 'abgeschlossen' | 'pausiert';
  start_datum?: string;
  end_datum?: string;
}

export interface DatenaufnahmeFilter {
  status?: string;
  zugewiesen_an?: string;
  erstellt_von?: string;
  liegenschaft_id?: string;
  objekt_id?: string;
}

export interface DatenaufnahmeStatistik {
  gesamt_anlagen: number;
  bearbeitete_anlagen: number;
  such_modus_anlagen: number;
  fortschritt_prozent: number;
}

// Import types from other modules
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Liegenschaft {
  id: string;
  name: string;
  adresse?: string;
}

interface Objekt {
  id: string;
  name: string;
  liegenschaft_id: string;
}

interface Anlage {
  id: string;
  name: string;
  t_nummer?: string;
  aks_code?: string;
  objekt_id: string;
}