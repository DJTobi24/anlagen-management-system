import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '@/config/database';
import redisClient from '@/config/redis';
import { AuthTokens, JWTPayload, RefreshTokenPayload } from '@/types';
import { createError } from '@/middleware/errorHandler';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET!;
  private static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  private static JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw createError('Invalid or expired access token', 401);
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      throw createError('Invalid or expired refresh token', 401);
    }
  }

  static async login(email: string, password: string): Promise<AuthTokens> {
    const query = `
      SELECT u.*, m.name as mandant_name 
      FROM users u
      JOIN mandanten m ON u.mandant_id = m.id
      WHERE u.email = $1 AND u.is_active = true AND m.is_active = true
    `;
    
    const { rows } = await pool.query(query, [email]);
    
    if (rows.length === 0) {
      throw createError('Invalid credentials', 401);
    }

    const user = rows[0];
    const isValidPassword = await this.comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    const tokenVersion = await this.getTokenVersion(user.id);
    
    const accessTokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mandantId: user.mandant_id,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion,
    };

    const accessToken = this.generateAccessToken(accessTokenPayload);
    const refreshToken = this.generateRefreshToken(refreshTokenPayload);

    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    
    const isValidRefreshToken = await this.validateRefreshToken(refreshToken);
    if (!isValidRefreshToken) {
      throw createError('Invalid refresh token', 401);
    }

    const currentTokenVersion = await this.getTokenVersion(payload.userId);
    if (payload.tokenVersion !== currentTokenVersion) {
      throw createError('Token version mismatch', 401);
    }

    const query = `
      SELECT u.*, m.name as mandant_name 
      FROM users u
      JOIN mandanten m ON u.mandant_id = m.id
      WHERE u.id = $1 AND u.is_active = true AND m.is_active = true
    `;
    
    const { rows } = await pool.query(query, [payload.userId]);
    
    if (rows.length === 0) {
      throw createError('User not found or inactive', 401);
    }

    const user = rows[0];
    
    const accessTokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mandantId: user.mandant_id,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion: currentTokenVersion,
    };

    const newAccessToken = this.generateAccessToken(accessTokenPayload);
    const newRefreshToken = this.generateRefreshToken(refreshTokenPayload);

    await this.revokeRefreshToken(refreshToken);
    await this.storeRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }

  static async revokeAllTokens(userId: string): Promise<void> {
    await this.incrementTokenVersion(userId);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  }

  private static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
  }

  private static async validateRefreshToken(token: string): Promise<boolean> {
    const { rows } = await pool.query(
      'SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return rows.length > 0;
  }

  private static async revokeRefreshToken(token: string): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }

  private static async getTokenVersion(userId: string): Promise<number> {
    const key = `token_version:${userId}`;
    const version = await redisClient.get(key);
    return version ? parseInt(version, 10) : 0;
  }

  private static async incrementTokenVersion(userId: string): Promise<number> {
    const key = `token_version:${userId}`;
    return await redisClient.incr(key);
  }
}