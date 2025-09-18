import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { UserService } from '@/services/userService';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  role: Joi.string().valid('admin', 'techniker', 'aufnehmer').required(),
  mandantId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).optional(),
  lastName: Joi.string().min(2).optional(),
  role: Joi.string().valid('admin', 'techniker', 'aufnehmer').optional(),
  isActive: Joi.boolean().optional(),
  mandantId: Joi.string().uuid().optional()
});

const createMandantSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
  adminEmail: Joi.string().email().required(),
  adminPassword: Joi.string().min(6).required(),
  adminFirstName: Joi.string().min(2).required(),
  adminLastName: Joi.string().min(2).required()
});

const updateMandantSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  isActive: Joi.boolean().optional()
});

export class UserManagementController {
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isSystemAdmin = req.user?.role === 'system_admin';
      const { includeInactive } = req.query;
      
      const users = await UserService.getAllUsers(
        isSystemAdmin, 
        req.user?.mandantId || ''
      );

      res.json({
        message: 'Users retrieved successfully',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isSystemAdmin = req.user?.role === 'system_admin';

      const user = await UserService.getUserById(
        id,
        isSystemAdmin ? null : req.user?.mandantId || '',
        isSystemAdmin
      );

      res.json({
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const isSystemAdmin = req.user?.role === 'system_admin';
      
      if (!isSystemAdmin && value.mandantId) {
        throw createError('Only system admins can specify mandantId', 403);
      }

      const mandantId = value.mandantId || req.user?.mandantId;
      if (!mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const user = await UserService.createUser({
        ...value,
        mandantId
      });

      res.status(201).json({
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error, value } = updateUserSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const isSystemAdmin = req.user?.role === 'system_admin';
      
      if (!isSystemAdmin && value.mandantId) {
        throw createError('Only system admins can change mandantId', 403);
      }

      const user = await UserService.updateUser(
        id,
        isSystemAdmin ? null : req.user?.mandantId || '',
        isSystemAdmin,
        value
      );

      res.json({
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isSystemAdmin = req.user?.role === 'system_admin';

      if (id === req.user?.id) {
        throw createError('Cannot delete your own account', 400);
      }

      await UserService.deleteUser(
        id,
        isSystemAdmin ? null : req.user?.mandantId || '',
        isSystemAdmin
      );

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        throw createError('Password must be at least 6 characters long', 400);
      }

      const isSystemAdmin = req.user?.role === 'system_admin';
      
      if (!isSystemAdmin && id !== req.user?.id) {
        const user = await UserService.getUserById(id, req.user?.mandantId || '', false);
        if (user.mandant_id !== req.user?.mandantId) {
          throw createError('Access denied', 403);
        }
      }

      await UserService.changePassword(id, newPassword);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw createError('Email is required', 400);
      }

      const result = await UserService.resetPassword(email);

      res.json({
        message: 'Password reset successfully',
        data: {
          temporaryPassword: result.newPassword
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Mandanten Management

  static async getAllMandanten(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'system_admin') {
        throw createError('Access denied. System admin only.', 403);
      }

      const { includeInactive } = req.query;
      const mandanten = await UserService.getAllMandanten(includeInactive === 'true');

      res.json({
        message: 'Mandanten retrieved successfully',
        data: mandanten
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMandantById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const isSystemAdmin = req.user?.role === 'system_admin';

      if (!isSystemAdmin && id !== req.user?.mandantId) {
        throw createError('Access denied', 403);
      }

      const mandant = await UserService.getMandantById(id);

      res.json({
        message: 'Mandant retrieved successfully',
        data: mandant
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMandant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'system_admin') {
        throw createError('Access denied. System admin only.', 403);
      }

      const { error, value } = createMandantSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const result = await UserService.createMandant(value);

      res.status(201).json({
        message: 'Mandant created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMandant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'system_admin') {
        throw createError('Access denied. System admin only.', 403);
      }

      const { id } = req.params;
      const { error, value } = updateMandantSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const mandant = await UserService.updateMandant(id, value);

      res.json({
        message: 'Mandant updated successfully',
        data: mandant
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMandant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'system_admin') {
        throw createError('Access denied. System admin only.', 403);
      }

      const { id } = req.params;
      await UserService.deleteMandant(id);

      res.json({
        message: 'Mandant deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isSystemAdmin = req.user?.role === 'system_admin';
      const mandantId = isSystemAdmin && req.query.mandantId 
        ? req.query.mandantId as string 
        : req.user?.mandantId;

      const stats = await UserService.getUserStatistics(mandantId);

      res.json({
        message: 'Statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}