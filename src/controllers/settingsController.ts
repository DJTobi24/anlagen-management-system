import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';
import { SettingsService } from '@/services/settingsService';
import { AuthService } from '@/services/authService';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Logo upload configuration
const storage = multer.diskStorage({
  destination: './uploads/logos',
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('logo');

const mandantSettingsSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  primaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  customSettings: Joi.object().optional()
});

const userProfileSchema = Joi.object({
  firstName: Joi.string().min(2).optional(),
  lastName: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  currentPassword: Joi.string().when('newPassword', {
    is: Joi.exist(),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  newPassword: Joi.string().min(6).optional()
});

const userPreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  language: Joi.string().valid('de', 'en').optional(),
  highContrast: Joi.boolean().optional(),
  notifications: Joi.object({
    email: Joi.boolean().optional(),
    inApp: Joi.boolean().optional()
  }).optional(),
  tableRowsPerPage: Joi.number().valid(10, 25, 50, 100).optional()
});

export class SettingsController {
  // Mandant Settings
  static async getMandantSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isSystemAdmin = req.user?.role === 'system_admin';
      const mandantId = req.params.mandantId || req.user?.mandantId;

      if (!mandantId) {
        throw createError('Mandant ID required', 400);
      }

      // Check permissions
      if (!isSystemAdmin && mandantId !== req.user?.mandantId) {
        throw createError('Access denied', 403);
      }

      const settings = await SettingsService.getMandantSettings(mandantId);

      res.json({
        message: 'Mandant settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMandantSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isSystemAdmin = req.user?.role === 'system_admin';
      const isAdmin = req.user?.role === 'admin';
      const mandantId = req.params.mandantId || req.user?.mandantId;

      if (!mandantId) {
        throw createError('Mandant ID required', 400);
      }

      // Only system admins and mandant admins can update settings
      if (!isSystemAdmin && (!isAdmin || mandantId !== req.user?.mandantId)) {
        throw createError('Access denied', 403);
      }

      const { error, value } = mandantSettingsSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const settings = await SettingsService.updateMandantSettings(mandantId, value);

      res.json({
        message: 'Mandant settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMandantLogo(req: AuthRequest, res: Response, next: NextFunction) {
    upload(req, res, async (err) => {
      if (err) {
        return next(createError(err.message, 400));
      }

      try {
        const isSystemAdmin = req.user?.role === 'system_admin';
        const isAdmin = req.user?.role === 'admin';
        const mandantId = req.params.mandantId || req.user?.mandantId;

        if (!mandantId) {
          throw createError('Mandant ID required', 400);
        }

        // Only system admins and mandant admins can upload logo
        if (!isSystemAdmin && (!isAdmin || mandantId !== req.user?.mandantId)) {
          throw createError('Access denied', 403);
        }

        if (!req.file) {
          throw createError('No file uploaded', 400);
        }

        const logoPath = `/uploads/logos/${req.file.filename}`;
        const settings = await SettingsService.updateMandantLogo(mandantId, logoPath);

        res.json({
          message: 'Logo uploaded successfully',
          data: settings
        });
      } catch (error) {
        next(error);
      }
    });
  }

  // User Profile
  static async getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const profile = await SettingsService.getUserProfile(req.user.id);

      res.json({
        message: 'User profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { error, value } = userProfileSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      // If changing password, verify current password
      if (value.newPassword) {
        const isValidPassword = await AuthService.comparePassword(
          value.currentPassword,
          req.user.password
        );
        if (!isValidPassword) {
          throw createError('Current password is incorrect', 400);
        }
      }

      const profile = await SettingsService.updateUserProfile(req.user.id, value);

      res.json({
        message: 'User profile updated successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  // User Preferences
  static async getUserPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const preferences = await SettingsService.getUserPreferences(req.user.id);

      res.json({
        message: 'User preferences retrieved successfully',
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { error, value } = userPreferencesSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const preferences = await SettingsService.updateUserPreferences(req.user.id, value);

      res.json({
        message: 'User preferences updated successfully',
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }

  // All Mandanten Settings (System Admin only)
  static async getAllMandantenSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'system_admin') {
        throw createError('Access denied. System admin only.', 403);
      }

      const settings = await SettingsService.getAllMandantenSettings();

      res.json({
        message: 'All mandanten settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }
}