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
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).optional(),
  lastName: Joi.string().min(2).optional(),
  role: Joi.string().valid('admin', 'techniker', 'aufnehmer').optional(),
  isActive: Joi.boolean().optional(),
});

export class UserController {
  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const user = await UserService.createUser({
        ...value,
        mandantId: req.mandantId,
      });

      res.status(201).json({
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const users = await UserService.getUsersByMandant(req.mandantId);

      res.json({
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const user = await UserService.getUserById(id, req.mandantId);

      res.json({
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      const { error, value } = updateUserSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const user = await UserService.updateUser(id, req.mandantId, value);

      res.json({
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.mandantId) {
        throw createError('Mandant ID required', 400);
      }

      const { id } = req.params;
      await UserService.deleteUser(id, req.mandantId);

      res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}