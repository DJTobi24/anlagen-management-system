import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { AnlageService } from '@/services/anlageService';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

const createAnlageSchema = Joi.object({
  objektId: Joi.string().uuid().required(),
  tNummer: Joi.string().optional().allow(null),
  aksCode: Joi.string().required(),
  name: Joi.string().min(2).required(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('aktiv', 'inaktiv', 'wartung', 'defekt').default('aktiv'),
  zustandsBewertung: Joi.number().integer().min(1).max(5).required(),
  dynamicFields: Joi.object().optional(),
});

const updateAnlageSchema = Joi.object({
  tNummer: Joi.string().optional().allow(null),
  aksCode: Joi.string().optional(),
  name: Joi.string().min(2).optional(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('aktiv', 'inaktiv', 'wartung', 'defekt').optional(),
  zustandsBewertung: Joi.number().integer().min(1).max(5).optional(),
  dynamicFields: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

const searchAnlagenSchema = Joi.object({
  objektId: Joi.string().uuid().optional(),
  status: Joi.string().valid('aktiv', 'inaktiv', 'wartung', 'defekt').optional(),
  aksCode: Joi.string().optional(),
  zustandsBewertung: Joi.number().integer().min(1).max(5).optional(),
  search: Joi.string().optional(),
});

export class AnlageController {
  static async createAnlage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { error, value } = createAnlageSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const anlage = await AnlageService.createAnlage(value, req.mandantId);

      res.status(201).json({
        message: 'Anlage created successfully',
        data: anlage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnlagen(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const anlagen = await AnlageService.getAnlagenByMandant(req.mandantId);

      res.json({
        message: 'Anlagen retrieved successfully',
        data: anlagen,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnlageById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const anlage = await AnlageService.getAnlageById(id, req.mandantId);

      res.json({
        message: 'Anlage retrieved successfully',
        data: anlage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnlageByQrCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { qrCode } = req.params;
      const anlage = await AnlageService.getAnlageByQrCode(decodeURIComponent(qrCode), req.mandantId);

      res.json({
        message: 'Anlage retrieved successfully',
        data: anlage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAnlage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const { error, value } = updateAnlageSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const anlage = await AnlageService.updateAnlage(id, req.mandantId, value);

      res.json({
        message: 'Anlage updated successfully',
        data: anlage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnlage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      await AnlageService.deleteAnlage(id, req.mandantId);

      res.json({
        message: 'Anlage deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchAnlagen(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { error, value } = searchAnlagenSchema.validate(req.query);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const anlagen = await AnlageService.searchAnlagen(req.mandantId, value);

      res.json({
        message: 'Anlagen search completed successfully',
        data: anlagen,
      });
    } catch (error) {
      next(error);
    }
  }
}