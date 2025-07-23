import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthService } from '@/services/authService';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

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

      res.json({
        message: 'User profile retrieved successfully',
        data: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }
}