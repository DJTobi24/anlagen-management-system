export interface AksCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  maintenanceIntervalMonths?: number;
  maintenanceType?: string;
  maintenanceDescription?: string;
  fields?: AksField[];
  level?: number;
  parentCode?: string;
  isCategory?: boolean;
  hasChildren?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AksField {
  id: string;
  aksCodeId: string;
  kasCode: string;
  fieldName: string;
  displayName: string;
  fieldType: AksFieldType;
  dataType: AksDataType;
  unit?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  options?: AksFieldOption[];
  defaultValue?: any;
  helpText?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export enum AksFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  TEXTAREA = 'textarea',
  FILE = 'file',
  RADIO = 'radio',
  CHECKBOX = 'checkbox'
}

export enum AksDataType {
  STRING = 'string',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  DATE = 'date',
  BOOLEAN = 'boolean',
  JSON = 'json'
}

export interface AksFieldOption {
  value: string;
  label: string;
  order: number;
}

export interface AksImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  createdCodes: number;
  updatedCodes: number;
  createdFields: number;
  updatedFields: number;
  errors: AksImportError[];
  importSummary?: {
    filename?: string;
    importedAt: string;
    processingTime?: number;
  };
}

export interface AksImportError {
  row: number;
  aksCode?: string;
  kasCode?: string;
  message: string;
  data?: any;
}

export interface AksSearchParams {
  code?: string;
  name?: string;
  category?: string;
  hasFields?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}