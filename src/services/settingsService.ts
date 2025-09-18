import pool from '@/config/database';
import { AuthService } from '@/services/authService';
import { createError } from '@/middleware/errorHandler';
import fs from 'fs/promises';
import path from 'path';

interface MandantSettings {
  mandantId: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customSettings?: Record<string, any>;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mandantId: string;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'de' | 'en';
  highContrast: boolean;
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  tableRowsPerPage: number;
}

export class SettingsService {
  // Mandant Settings
  static async getMandantSettings(mandantId: string): Promise<MandantSettings> {
    const query = `
      SELECT 
        m.id as mandant_id,
        m.name,
        ms.logo,
        ms.primary_color,
        ms.secondary_color,
        ms.custom_settings
      FROM mandanten m
      LEFT JOIN mandant_settings ms ON m.id = ms.mandant_id
      WHERE m.id = $1
    `;

    const { rows } = await pool.query(query, [mandantId]);

    if (rows.length === 0) {
      throw createError('Mandant not found', 404);
    }

    const row = rows[0];
    return {
      mandantId: row.mandant_id,
      name: row.name,
      logo: row.logo,
      primaryColor: row.primary_color || '#4F46E5',
      secondaryColor: row.secondary_color || '#7C3AED',
      customSettings: row.custom_settings || {}
    };
  }

  static async updateMandantSettings(
    mandantId: string,
    settings: Partial<MandantSettings>
  ): Promise<MandantSettings> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update mandant name if provided
      if (settings.name) {
        await client.query(
          'UPDATE mandanten SET name = $1, updated_at = NOW() WHERE id = $2',
          [settings.name, mandantId]
        );
      }

      // Check if settings record exists
      const settingsCheck = await client.query(
        'SELECT id FROM mandant_settings WHERE mandant_id = $1',
        [mandantId]
      );

      if (settingsCheck.rows.length === 0) {
        // Create new settings record
        await client.query(
          `INSERT INTO mandant_settings (mandant_id, primary_color, secondary_color, custom_settings)
           VALUES ($1, $2, $3, $4)`,
          [
            mandantId,
            settings.primaryColor || '#4F46E5',
            settings.secondaryColor || '#7C3AED',
            JSON.stringify(settings.customSettings || {})
          ]
        );
      } else {
        // Update existing settings
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (settings.primaryColor) {
          updates.push(`primary_color = $${paramCount++}`);
          values.push(settings.primaryColor);
        }
        if (settings.secondaryColor) {
          updates.push(`secondary_color = $${paramCount++}`);
          values.push(settings.secondaryColor);
        }
        if (settings.customSettings) {
          updates.push(`custom_settings = $${paramCount++}`);
          values.push(JSON.stringify(settings.customSettings));
        }

        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          values.push(mandantId);
          
          await client.query(
            `UPDATE mandant_settings SET ${updates.join(', ')} WHERE mandant_id = $${paramCount}`,
            values
          );
        }
      }

      await client.query('COMMIT');

      return await this.getMandantSettings(mandantId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateMandantLogo(mandantId: string, logoPath: string): Promise<MandantSettings> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if settings record exists
      const settingsCheck = await client.query(
        'SELECT id, logo FROM mandant_settings WHERE mandant_id = $1',
        [mandantId]
      );

      // Delete old logo file if exists
      if (settingsCheck.rows.length > 0 && settingsCheck.rows[0].logo) {
        const oldLogoPath = path.join(process.cwd(), settingsCheck.rows[0].logo);
        try {
          await fs.unlink(oldLogoPath);
        } catch (err) {
          console.error('Error deleting old logo:', err);
        }
      }

      if (settingsCheck.rows.length === 0) {
        // Create new settings record
        await client.query(
          'INSERT INTO mandant_settings (mandant_id, logo) VALUES ($1, $2)',
          [mandantId, logoPath]
        );
      } else {
        // Update existing settings
        await client.query(
          'UPDATE mandant_settings SET logo = $1, updated_at = NOW() WHERE mandant_id = $2',
          [logoPath, mandantId]
        );
      }

      await client.query('COMMIT');

      return await this.getMandantSettings(mandantId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // User Profile
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const query = `
      SELECT 
        id, email, first_name, last_name, role, 
        mandant_id, mfa_enabled, created_at
      FROM users
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      throw createError('User not found', 404);
    }

    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      mandantId: user.mandant_id,
      mfaEnabled: user.mfa_enabled,
      createdAt: user.created_at
    };
  }

  static async updateUserProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      newPassword?: string;
    }
  ): Promise<UserProfile> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email is already taken
      if (updates.email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updates.email, userId]
        );
        if (emailCheck.rows.length > 0) {
          throw createError('Email already in use', 409);
        }
      }

      // Build update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (updates.firstName) {
        updateFields.push(`first_name = $${paramCount++}`);
        values.push(updates.firstName);
      }
      if (updates.lastName) {
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(updates.lastName);
      }
      if (updates.email) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }
      if (updates.newPassword) {
        const hashedPassword = await AuthService.hashPassword(updates.newPassword);
        updateFields.push(`password = $${paramCount++}`);
        values.push(hashedPassword);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        values.push(userId);

        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          values
        );

        // If password was changed, revoke all tokens
        if (updates.newPassword) {
          await AuthService.revokeAllTokens(userId);
        }
      }

      await client.query('COMMIT');

      return await this.getUserProfile(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // User Preferences
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    const query = `
      SELECT * FROM user_preferences WHERE user_id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      // Return default preferences
      return {
        userId,
        theme: 'light',
        language: 'de',
        highContrast: false,
        notifications: {
          email: true,
          inApp: true
        },
        tableRowsPerPage: 25
      };
    }

    const prefs = rows[0];
    return {
      userId: prefs.user_id,
      theme: prefs.theme,
      language: prefs.language,
      highContrast: prefs.high_contrast,
      notifications: prefs.notifications,
      tableRowsPerPage: prefs.table_rows_per_page
    };
  }

  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // Check if preferences record exists
    const checkQuery = 'SELECT id FROM user_preferences WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);

    if (checkResult.rows.length === 0) {
      // Create new preferences record
      const insertQuery = `
        INSERT INTO user_preferences (
          user_id, theme, language, high_contrast, 
          notifications, table_rows_per_page
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await pool.query(insertQuery, [
        userId,
        preferences.theme || 'light',
        preferences.language || 'de',
        preferences.highContrast || false,
        JSON.stringify(preferences.notifications || { email: true, inApp: true }),
        preferences.tableRowsPerPage || 25
      ]);
    } else {
      // Update existing preferences
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (preferences.theme !== undefined) {
        updates.push(`theme = $${paramCount++}`);
        values.push(preferences.theme);
      }
      if (preferences.language !== undefined) {
        updates.push(`language = $${paramCount++}`);
        values.push(preferences.language);
      }
      if (preferences.highContrast !== undefined) {
        updates.push(`high_contrast = $${paramCount++}`);
        values.push(preferences.highContrast);
      }
      if (preferences.notifications !== undefined) {
        updates.push(`notifications = $${paramCount++}`);
        values.push(JSON.stringify(preferences.notifications));
      }
      if (preferences.tableRowsPerPage !== undefined) {
        updates.push(`table_rows_per_page = $${paramCount++}`);
        values.push(preferences.tableRowsPerPage);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(userId);

        await pool.query(
          `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = $${paramCount}`,
          values
        );
      }
    }

    return await this.getUserPreferences(userId);
  }

  // Get all mandanten settings (for system admin)
  static async getAllMandantenSettings(): Promise<MandantSettings[]> {
    const query = `
      SELECT 
        m.id as mandant_id,
        m.name,
        m.is_active,
        ms.logo,
        ms.primary_color,
        ms.secondary_color,
        ms.custom_settings,
        COUNT(DISTINCT u.id) as user_count
      FROM mandanten m
      LEFT JOIN mandant_settings ms ON m.id = ms.mandant_id
      LEFT JOIN users u ON m.id = u.mandant_id AND u.is_active = true
      GROUP BY m.id, m.name, m.is_active, ms.logo, ms.primary_color, ms.secondary_color, ms.custom_settings
      ORDER BY m.name
    `;

    const { rows } = await pool.query(query);

    return rows.map(row => ({
      mandantId: row.mandant_id,
      name: row.name,
      logo: row.logo,
      primaryColor: row.primary_color || '#4F46E5',
      secondaryColor: row.secondary_color || '#7C3AED',
      customSettings: row.custom_settings || {},
      isActive: row.is_active,
      userCount: parseInt(row.user_count)
    }));
  }
}