export interface User {
  id: string;
  email: string;
  name: string;
  rolle: 'admin' | 'manager' | 'techniker' | 'viewer';
  mandant_id: string;
  mandant?: Mandant;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
}

export interface Mandant {
  id: string;
  name: string;
  code: string;
  beschreibung?: string;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
}

export interface Anlage {
  id: string;
  anlagen_nummer: string;
  bezeichnung: string;
  liegenschaft: string;
  objekt: string;
  aks_code: string;
  hersteller?: string;
  modell?: string;
  seriennummer?: string;
  baujahr?: number;
  letzte_wartung?: string;
  naechste_wartung?: string;
  status: 'aktiv' | 'wartung' | 'störung' | 'außer Betrieb';
  mandant_id: string;
  wartungsintervall_monate?: number;
  anschaffungswert?: number;
  standort?: string;
  verantwortlicher?: string;
  bemerkungen?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export interface AksCode {
  id: string;
  code: string;
  bezeichnung: string;
  kategorie: string;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: string[];
  mandant_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Statistics {
  total_anlagen: number;
  anlagen_by_status: {
    aktiv: number;
    wartung: number;
    störung: number;
    'außer Betrieb': number;
  };
  wartung_faellig: number;
  wartung_ueberfaellig: number;
  anlagen_by_kategorie: Record<string, number>;
}