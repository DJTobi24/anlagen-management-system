import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthService } from '@/services/authService';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';
import pool from '@/config/database';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const { email, password } = value;
      const tokens = await AuthService.login(email, password);

      res.json({
        message: 'Login successful',
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = refreshSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const { refreshToken } = value;
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = refreshSchema.validate(req.body);
      
      if (error) {
        throw createError(error.details[0].message, 400);
      }

      const { refreshToken } = value;
      await AuthService.logout(refreshToken);

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      await AuthService.revokeAllTokens(req.user.id);

      res.json({
        message: 'All tokens revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { password, ...userWithoutPassword } = req.user;

      // Get mandant information for the user
      const mandantQuery = await pool.query(
        'SELECT id, name, description, is_active, created_at, updated_at FROM mandanten WHERE id = $1',
        [userWithoutPassword.mandantId]
      );
      const mandant = mandantQuery.rows[0];

      // Transform backend data to match frontend expectations
      const transformedUser = {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: `${userWithoutPassword.firstName} ${userWithoutPassword.lastName}`,
        rolle: userWithoutPassword.role, // role -> rolle
        mandant_id: userWithoutPassword.mandantId,
        mandant: mandant ? {
          id: mandant.id,
          name: mandant.name,
          code: mandant.name.substring(0, 3).toUpperCase(), // Generate code from name
          beschreibung: mandant.description,
          aktiv: mandant.is_active,
          created_at: mandant.created_at,
          updated_at: mandant.updated_at
        } : undefined,
        aktiv: userWithoutPassword.isActive, // is_active -> aktiv
        created_at: userWithoutPassword.createdAt,
        updated_at: userWithoutPassword.updatedAt
      };

      res.json({
        message: 'User profile retrieved successfully',
        data: transformedUser
      });
    } catch (error) {
      next(error);
    }
  }
}