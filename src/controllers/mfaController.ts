import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import pool from '@/config/database';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const getMfaStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT totp_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    
    res.json({
      data: {
        enabled: result.rows[0]?.totp_enabled || false
      }
    });
  } catch (error) {
    next(error);
  }
};

export const setupMfa = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `AMS (${req.user.email})`,
      length: 32
    });
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Store temporary secret
    await pool.query(
      'UPDATE users SET totp_temp_secret = $1 WHERE id = $2',
      [secret.base32, req.user.id]
    );
    
    res.json({
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyMfaSetup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    // Get temp secret
    const result = await pool.query(
      'SELECT totp_temp_secret FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const tempSecret = result.rows[0]?.totp_temp_secret;
    if (!tempSecret) {
      return res.status(400).json({ error: 'No MFA setup in progress' });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token,
      window: 1
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    // Enable MFA
    await pool.query(
      'UPDATE users SET totp_secret = $1, totp_enabled = true, totp_temp_secret = NULL WHERE id = $2',
      [tempSecret, req.user.id]
    );
    
    res.json({
      data: {
        message: '2FA erfolgreich aktiviert'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const disableMfa = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      'UPDATE users SET totp_secret = NULL, totp_enabled = false, totp_temp_secret = NULL WHERE id = $1',
      [req.user.id]
    );
    
    res.json({
      data: {
        message: '2FA wurde deaktiviert'
      }
    });
  } catch (error) {
    next(error);
  }
};