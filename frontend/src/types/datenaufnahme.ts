// Types for Datenaufnahme (Data Collection) Frontend

export interface DatenaufnahmeAuftrag {
  id: string;
  mandant_id: string;
  titel: string;
  beschreibung?: string;
  erstellt_von: string;
  zugewiesen_an: string;
  status: 'vorbereitet' | 'in_bearbeitung' | 'abgeschlossen' | 'pausiert';
  start_datum?: string;
  end_datum?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Zusätzliche Felder aus dem Join
  ersteller_email?: string;
  ersteller_name?: string;
  mitarbeiter_email?: string;
  mitarbeiter_name?: string;
  anzahl_liegenschaften?: number;
  anzahl_objekte?: number;
  anzahl_anlagen?: number;
  anzahl_bearbeitet?: number;
  zu_suchende_anlagen?: number;
  
  // Detaillierte Beziehungen
  liegenschaften?: any[];
  objekte?: any[];
  anlagen?: DatenaufnahmeAnlage[];
  statistik?: DatenaufnahmeStatistik;
}

export interface DatenaufnahmeAnlage {
  id: string;
  aufnahme_id: string;
  anlage_id: string;
  sichtbar: boolean;
  such_modus: boolean;
  notizen?: string;
  bearbeitet: boolean;
  bearbeitet_am?: string;
  created_at: string;
  updated_at: string;
  
  // Anlage-Details
  anlage_name?: string;
  t_nummer?: string;
  aks_code?: string;
  anlage_status?: string;
  objekt_name?: string;
  liegenschaft_name?: string;
}

export interface DatenaufnahmeFortschritt {
  id: string;
  aufnahme_id: string;
  anlage_id: string;
  aktion: string;
  alte_werte?: any;
  neue_werte?: any;
  benutzer_id: string;
  created_at: string;
  
  // Zusätzliche Felder
  anlage_name?: string;
  t_nummer?: string;
  benutzer_name?: string;
  benutzer_email?: string;
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