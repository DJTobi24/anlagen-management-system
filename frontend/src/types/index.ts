export interface User {
  id: string;
  email: string;
  name: string;
  rolle: 'admin' | 'techniker' | 'aufnehmer';
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
  name: string;
  t_nummer?: string;
  aks_code: string;
  description?: string;
  status: 'aktiv' | 'wartung' | 'defekt' | 'inaktiv';
  zustands_bewertung: number;
  objekt_id: string;
  objekt_name?: string;
  liegenschaft_name?: string;
  qr_code?: string;
  dynamic_fields?: Record<string, any>;
  is_active: boolean;
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