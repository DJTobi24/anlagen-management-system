import { Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { AuthRequest, UserRole } from '@/types';
import { createError } from '@/middleware/errorHandler';
import pool from '@/config/database';

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization as string;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [payload.userId]
    );

    if (rows.length === 0) {
      throw createError('User not found or inactive', 401);
    }

    req.user = rows[0];
    req.mandantId = payload.mandantId;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const mandantAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.mandantId) {
      throw createError('Authentication required', 401);
    }

    const { rows } = await pool.query(
      'SELECT id FROM mandanten WHERE id = $1 AND is_active = true',
      [req.mandantId]
    );

    if (rows.length === 0) {
      throw createError('Mandant not found or inactive', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};