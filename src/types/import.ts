export interface ImportJob {
  id: string;
  mandantId: string;
  userId: string;
  fileName: string;
  originalName: string;
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errors: ImportError[];
  rollbackData?: RollbackData;
  createdAt: Date;
  updatedAt: Date;
}

export enum ImportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ROLLED_BACK = 'rolled_back'
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportRow {
  row: number;
  tNummer?: string;
  aksCode: string;
  name: string;
  description?: string;
  status: string;
  zustandsBewertung: number;
  objektName?: string;
  liegenschaftName?: string;
  floor?: string;
  room?: string;
  dynamicFields: Record<string, any>;
}

export interface ProcessedRow extends ImportRow {
  success: boolean;
  error?: string;
  anlageId?: string;
  objektId?: string;
}

export interface ExcelColumnMapping {
  tNummer: string;
  aksCode: string;
  name: string;
  description?: string;
  status: string;
  zustandsBewertung: string;
  objektName: string;
  liegenschaftName: string;
  floor?: string;
  room?: string;
  [key: string]: string | undefined;
}

export interface ImportJobData {
  jobId: string;
  mandantId: string;
  userId: string;
  filePath: string;
  fileName: string;
  columnMapping: ExcelColumnMapping;
  batchSize: number;
}

export interface RollbackData {
  createdAnlagen: string[];
  updatedAnlagen: Array<{
    id: string;
    previousData: any;
  }>;
  createdObjekte: string[];
  createdLiegenschaften: string[];
}

export interface ImportStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface WorkerMessage {
  type: 'progress' | 'complete' | 'error';
  jobId: string;
  data?: any;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
  totalRows: number;
}