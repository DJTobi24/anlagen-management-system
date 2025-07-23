import { Response, NextFunction } from 'express';
import multer from 'multer';
import Joi from 'joi';
import { ImportService } from '@/services/importService';
import { AuthRequest } from '@/types';
import { ExcelColumnMapping } from '@/types/import';
import { createError } from '@/middleware/errorHandler';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
}).single('excel');

const columnMappingSchema = Joi.object({
  tNummer: Joi.string().required(),
  aksCode: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  status: Joi.string().required(),
  zustandsBewertung: Joi.string().required(),
  objektName: Joi.string().required(),
  liegenschaftName: Joi.string().required(),
  floor: Joi.string().optional(),
  room: Joi.string().optional()
}).unknown(true); // Allow additional fields for dynamic columns

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export class ImportController {
  static uploadMiddleware = upload;

  static async uploadExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.mandantId) {
        throw createError('Authentication required', 401);
      }

      if (!req.file) {
        throw createError('No Excel file uploaded', 400);
      }

      // Parse column mapping from request body
      let columnMapping: ExcelColumnMapping;
      try {
        columnMapping = req.body.columnMapping 
          ? JSON.parse(req.body.columnMapping)
          : ImportService.getDefaultColumnMapping();
      } catch (error) {
        throw createError('Invalid column mapping format', 400);
      }

      // Validate column mapping
      const { error } = columnMappingSchema.validate(columnMapping);
      if (error) {
        throw createError(`Invalid column mapping: ${error.details[0].message}`, 400);
      }

      // Initialize upload directory
      await ImportService.initializeUploadDirectory();

      // Start import process
      const result = await ImportService.validateAndStartImport(
        req.mandantId,
        req.user.id,
        req.file,
        columnMapping
      );

      res.status(201).json({
        message: 'Import job started successfully',
        data: {
          jobId: result.jobId,
          validation: result.validation,
          estimatedRows: result.validation.totalRows
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const { page, limit } = value;
      const offset = (page - 1) * limit;

      const result = await ImportService.getJobsByMandant(req.mandantId, limit, offset);

      res.json({
        message: 'Import jobs retrieved successfully',
        data: {
          jobs: result.jobs,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getJobById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const job = await ImportService.getJob(id, req.mandantId);

      res.json({
        message: 'Import job retrieved successfully',
        data: job
      });

    } catch (error) {
      next(error);
    }
  }

  static async getJobReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const reportBuffer = await ImportService.generateErrorReport(id, req.mandantId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="import-errors-${id}.xlsx"`);
      res.send(reportBuffer);

    } catch (error) {
      next(error);
    }
  }

  static async rollbackJob(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.mandantId) {
        throw createError('Authentication required', 401);
      }

      const { id } = req.params;
      await ImportService.rollbackImport(id, req.mandantId, req.user.id);

      res.json({
        message: 'Import job rolled back successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  static async cancelJob(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      await ImportService.cancelJob(id, req.mandantId);

      res.json({
        message: 'Import job cancelled successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const stats = await ImportService.getImportStats(req.mandantId);

      res.json({
        message: 'Import statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      next(error);
    }
  }

  static async getQueueStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Only admins can see queue statistics
      if (!req.user || req.user.role !== 'admin') {
        throw createError('Admin access required', 403);
      }

      const stats = await ImportService.getQueueStats();

      res.json({
        message: 'Queue statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      next(error);
    }
  }

  static async getDefaultMapping(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const defaultMapping = ImportService.getDefaultColumnMapping();

      res.json({
        message: 'Default column mapping retrieved successfully',
        data: defaultMapping
      });

    } catch (error) {
      next(error);
    }
  }
}