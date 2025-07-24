export interface AksCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  level?: number;
  parentCode?: string;
  isCategory?: boolean;
  sortOrder?: number;
  maintenanceIntervalMonths?: number;
  maintenanceType?: string;
  maintenanceDescription?: string;
  fields: AksField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AksField {
  id: string;
  aksCodeId: string;
  kasCode: string; // z.B. KAS1273
  fieldName: string; // z.B. 11_Leitfähigkeit
  displayName: string; // z.B. Leitfähigkeit
  fieldType: AksFieldType;
  dataType: AksDataType;
  unit?: string; // z.B. μS/cm, m³/h
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  options?: AksFieldOption[]; // für Select/Radio
  defaultValue?: any;
  helpText?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface AksFieldValue {
  fieldId: string;
  kasCode: string;
  value: any;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface AksValidationResult {
  isValid: boolean;
  errors: AksValidationError[];
  warnings: AksValidationWarning[];
}

export interface AksValidationError {
  fieldId: string;
  kasCode: string;
  fieldName: string;
  message: string;
  value?: any;
}

export interface AksValidationWarning {
  fieldId: string;
  kasCode: string;
  fieldName: string;
  message: string;
}

export interface AksImportRow {
  row: number;
  aksCode: string;
  aksName?: string;
  description?: string;
  maintenanceIntervalMonths?: number;
  maintenanceType?: string;
  maintenanceDescription?: string;
  // Legacy field import support
  kasCode: string;
  fieldName: string;
  displayName?: string;
  fieldType: string;
  dataType: string;
  unit?: string;
  isRequired: string | boolean;
  minValue?: string | number;
  maxValue?: string | number;
  minLength?: string | number;
  maxLength?: string | number;
  regex?: string;
  options?: string;
  defaultValue?: string;
  helpText?: string;
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
    importedAt: Date;
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

export interface AksFieldMapping {
  [kasCode: string]: {
    fieldName: string;
    displayName: string;
    fieldType: AksFieldType;
    dataType: AksDataType;
    unit?: string;
    isRequired: boolean;
    validation?: {
      minValue?: number;
      maxValue?: number;
      minLength?: number;
      maxLength?: number;
      regex?: string;
    };
  };
}

export interface AksSearchParams {
  code?: string;
  name?: string;
  category?: string;
  hasFields?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}