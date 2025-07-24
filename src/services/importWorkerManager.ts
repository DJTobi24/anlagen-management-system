import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { ImportRow, ProcessedRow, WorkerMessage, ImportJobData } from '@/types/import';

interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  jobId?: string;
}

export class ImportWorkerManager {
  private workers: WorkerInfo[] = [];
  private readonly maxWorkers: number;
  private readonly workerPath: string;

  constructor(maxWorkers?: number) {
    // Use 80% of available cores, max 25 as specified
    this.maxWorkers = maxWorkers || Math.min(25, Math.floor(os.cpus().length * 0.8));
    this.workerPath = path.join(__dirname, '../workers/importWorker.js');
    
    console.log(`ImportWorkerManager initialized with ${this.maxWorkers} workers`);
  }

  async processRowsInParallel(
    jobData: ImportJobData,
    rows: ImportRow[],
    onProgress?: (processed: number, total: number) => void,
    onWorkerComplete?: (results: ProcessedRow[]) => void
  ): Promise<ProcessedRow[]> {
    return new Promise((resolve, reject) => {
      const batchSize = Math.ceil(rows.length / this.maxWorkers);
      const batches = this.createBatches(rows, batchSize);
      const allResults: ProcessedRow[] = [];
      let completedWorkers = 0;
      let totalProcessed = 0;

      if (batches.length === 0) {
        resolve([]);
        return;
      }

      // Create workers for each batch
      batches.forEach((batch, index) => {
        const worker = new Worker(this.workerPath, {
          workerData: {
            ...jobData,
            startIndex: index * batchSize,
            endIndex: (index + 1) * batchSize - 1,
            rows: batch
          }
        });

        worker.on('message', (message: WorkerMessage) => {
          switch (message.type) {
            case 'progress':
              totalProcessed += message.data.processed;
              if (onProgress) {
                onProgress(totalProcessed, rows.length);
              }
              break;

            case 'complete': {
              const results = message.data as ProcessedRow[];
              allResults.push(...results);
              
              if (onWorkerComplete) {
                onWorkerComplete(results);
              }

              completedWorkers++;
              
              if (completedWorkers === batches.length) {
                // Sort results by original row number
                allResults.sort((a, b) => a.row - b.row);
                resolve(allResults);
              }
              
              worker.terminate();
              break;
            }

            case 'error':
              reject(new Error(`Worker error: ${message.data.error}`));
              worker.terminate();
              break;
          }
        });

        worker.on('error', (error) => {
          reject(new Error(`Worker thread error: ${error.message}`));
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });
  }

  private createBatches(rows: ImportRow[], batchSize: number): ImportRow[][] {
    const batches: ImportRow[][] = [];
    
    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }
    
    return batches;
  }

  async shutdown(): Promise<void> {
    const promises = this.workers.map(workerInfo => {
      return new Promise<void>((resolve) => {
        workerInfo.worker.on('exit', () => resolve());
        workerInfo.worker.terminate();
      });
    });

    await Promise.all(promises);
    this.workers = [];
    console.log('All import workers shut down');
  }

  getStats() {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.workers.filter(w => w.busy).length,
      totalWorkers: this.workers.length,
      availableCores: os.cpus().length
    };
  }
}

export const importWorkerManager = new ImportWorkerManager();