import { Response, NextFunction } from 'express';
import multer from 'multer';
import Joi from 'joi';
import { AksService } from '@/services/aksService';
import { AksImportService } from '@/services/aksImportService';
import { AuthRequest } from '@/types';
import { AksFieldType, AksDataType } from '@/types/aks';
import { createError } from '@/middleware/errorHandler';
import path from 'path';
import fs from 'fs';

// Configure multer for AKS Excel upload
const storage = multer.memoryStorage();
const aksUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

// Validation schemas
const createAksCodeSchema = Joi.object({
  code: Joi.string().pattern(/^AKS\.(\d{2}|\d{2}\.\d{3}|\d{2}\.\d{3}\.\d{2}|\d{2}\.\d{3}\.\d{2}\.\d{2})$/).required(),
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().max(100).optional(),
  maintenance_interval_months: Joi.number().integer().min(1).max(120).optional(),
  maintenance_type: Joi.string().max(50).optional(),
  maintenance_description: Joi.string().max(500).optional()
});

const updateAksCodeSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(null),
  category: Joi.string().max(100).optional().allow(null),
  maintenance_interval_months: Joi.number().integer().min(1).max(120).optional().allow(null),
  maintenance_type: Joi.string().max(50).optional().allow(null),
  maintenance_description: Joi.string().max(500).optional().allow(null),
  isActive: Joi.boolean().optional()
});

const createAksFieldSchema = Joi.object({
  kasCode: Joi.string().pattern(/^KAS\d{4}$/).required(),
  fieldName: Joi.string().min(2).max(100).required(),
  displayName: Joi.string().min(2).max(255).required(),
  fieldType: Joi.string().valid(...Object.values(AksFieldType)).required(),
  dataType: Joi.string().valid(...Object.values(AksDataType)).required(),
  unit: Joi.string().max(50).optional(),
  isRequired: Joi.boolean().required(),
  minValue: Joi.number().optional(),
  maxValue: Joi.number().optional(),
  minLength: Joi.number().integer().min(0).optional(),
  maxLength: Joi.number().integer().min(0).optional(),
  regex: Joi.string().max(500).optional(),
  options: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required(),
    order: Joi.number().integer().optional()
  })).optional(),
  defaultValue: Joi.string().optional(),
  helpText: Joi.string().max(500).optional(),
  order: Joi.number().integer().min(0).optional()
});

const updateAksFieldSchema = Joi.object({
  displayName: Joi.string().min(2).max(255).optional(),
  isRequired: Joi.boolean().optional(),
  minValue: Joi.number().optional().allow(null),
  maxValue: Joi.number().optional().allow(null),
  minLength: Joi.number().integer().min(0).optional().allow(null),
  maxLength: Joi.number().integer().min(0).optional().allow(null),
  regex: Joi.string().max(500).optional().allow(null),
  options: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required(),
    order: Joi.number().integer().optional()
  })).optional(),
  defaultValue: Joi.string().optional().allow(null),
  helpText: Joi.string().max(500).optional().allow(null),
  order: Joi.number().integer().min(0).optional()
});

const searchAksSchema = Joi.object({
  code: Joi.string().allow('').optional(),
  name: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  hasFields: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const validateAksFieldsSchema = Joi.object({
  aksCode: Joi.string().required(),
  fieldValues: Joi.array().items(Joi.object({
    fieldId: Joi.string().uuid().optional(),
    kasCode: Joi.string().required(),
    value: Joi.any().required()
  })).required()
});

export class AksController {
  static uploadMiddleware = aksUpload;

  // AKS Code Management
  static async createAksCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { error, value } = createAksCodeSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const aksCode = await AksService.createAksCode(value);

      res.status(201).json({
        message: 'AKS code created successfully',
        data: aksCode
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAksCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const aksCode = await AksService.getAksCodeByCode(code);

      if (!aksCode) {
        throw createError('AKS code not found', 404);
      }

      res.json({
        message: 'AKS code retrieved successfully',
        data: aksCode
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchAksCodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { error, value } = searchAksSchema.validate(req.query);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const { page, limit, ...searchParams } = value;
      const offset = (page - 1) * limit;

      const result = await AksService.searchAksCodes({
        ...searchParams,
        limit,
        offset
      });

      res.json({
        message: 'AKS codes retrieved successfully',
        data: {
          codes: result.codes,
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

  static async updateAksCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error, value } = updateAksCodeSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const aksCode = await AksService.updateAksCode(id, value);

      res.json({
        message: 'AKS code updated successfully',
        data: aksCode
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAksCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await AksService.deleteAksCode(id);

      res.json({
        message: 'AKS code deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleAksCodeStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const aksCode = await AksService.toggleAksCodeStatus(id);

      res.json({
        message: `AKS code ${aksCode.isActive ? 'activated' : 'deactivated'} successfully`,
        data: aksCode
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkDeleteAksCodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw createError('No IDs provided for bulk delete', 400);
      }

      const results = await AksService.bulkDeleteAksCodes(ids);

      res.json({
        message: `Bulk delete completed`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkToggleAksCodesStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, isActive } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw createError('No IDs provided for bulk status update', 400);
      }

      if (typeof isActive !== 'boolean') {
        throw createError('isActive must be a boolean value', 400);
      }

      const results = await AksService.bulkToggleAksCodesStatus(ids, isActive);

      res.json({
        message: `Bulk status update completed`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateAksCodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, updateData } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw createError('No IDs provided for bulk update', 400);
      }

      if (!updateData || typeof updateData !== 'object') {
        throw createError('Update data is required', 400);
      }

      const results = await AksService.bulkUpdateAksCodes(ids, updateData);

      res.json({
        message: `Bulk update completed`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  // AKS Field Management
  static async createAksField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { codeId } = req.params;
      const { error, value } = createAksFieldSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const field = await AksService.createAksField(codeId, value);

      res.status(201).json({
        message: 'AKS field created successfully',
        data: field
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAksField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { error, value } = updateAksFieldSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const field = await AksService.updateAksField(fieldId, value);

      res.json({
        message: 'AKS field updated successfully',
        data: field
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAksField(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      await AksService.deleteAksField(fieldId);

      res.json({
        message: 'AKS field deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Field Validation
  static async validateAksFields(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { error, value } = validateAksFieldsSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const validationResult = await AksService.validateAksFields(
        value.aksCode,
        value.fieldValues
      );

      res.json({
        message: 'AKS fields validated',
        data: validationResult
      });
    } catch (error) {
      next(error);
    }
  }

  // Get field mapping for an AKS code
  static async getAksFieldMapping(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const mapping = await AksService.getAksFieldMapping(code);

      res.json({
        message: 'AKS field mapping retrieved successfully',
        data: mapping
      });
    } catch (error) {
      next(error);
    }
  }

  // AKS Import
  static async importAksFromExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw createError('No Excel file uploaded', 400);
      }

      // Save file temporarily
      const fileName = `aks_import_${Date.now()}.xlsx`;
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      
      fs.writeFileSync(filePath, req.file.buffer);

      try {
        const result = await AksImportService.importAksFromExcel(filePath);

        res.json({
          message: 'AKS import completed',
          data: result
        });
      } finally {
        // Clean up file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      next(error);
    }
  }

  // Download AKS import template
  static async downloadImportTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const templateBuffer = await AksImportService.generateImportTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="aks_import_template.xlsx"');
      res.send(templateBuffer);
    } catch (error) {
      next(error);
    }
  }

  // Download AKS import error report
  static async downloadAksErrorReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = req.body.errors || [];
      
      if (!Array.isArray(errors) || errors.length === 0) {
        throw createError('No errors to report', 400);
      }

      const reportBuffer = await AksImportService.generateAksErrorReport(errors);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="aks_import_errors.xlsx"');
      res.send(reportBuffer);
    } catch (error) {
      next(error);
    }
  }

  // Get categories
  static async getAksCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = [
        { value: 'Gebäude', label: 'Gebäude' },
        { value: 'HLK', label: 'Heizung, Lüftung, Klima' },
        { value: 'Sanitär', label: 'Sanitär' },
        { value: 'Gas/Medizin', label: 'Gas/Medizintechnik' },
        { value: 'Elektro', label: 'Elektrotechnik' },
        { value: 'Sicherheit', label: 'Sicherheitstechnik' },
        { value: 'Transport', label: 'Transportanlagen' },
        { value: 'Außenanlagen', label: 'Außenanlagen' },
        { value: 'Sonstiges', label: 'Sonstiges' }
      ];

      res.json({
        message: 'AKS categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  // Get field types
  static async getFieldTypes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fieldTypes = Object.values(AksFieldType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }));

      res.json({
        message: 'Field types retrieved successfully',
        data: fieldTypes
      });
    } catch (error) {
      next(error);
    }
  }

  // Get data types
  static async getDataTypes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dataTypes = Object.values(AksDataType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }));

      res.json({
        message: 'Data types retrieved successfully',
        data: dataTypes
      });
    } catch (error) {
      next(error);
    }
  }

  // Get AKS tree structure
  static async getAksTree(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { parentCode } = req.query;
      
      const tree = await AksService.getAksTree(parentCode as string);

      res.json({
        message: 'AKS tree retrieved successfully',
        data: tree
      });
    } catch (error) {
      next(error);
    }
  }
}