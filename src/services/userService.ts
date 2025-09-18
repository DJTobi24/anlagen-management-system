import pool from '@/config/database';
import { AuthService } from './authService';
import { User, UserRole } from '@/types';
import { createError } from '@/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface CreateMandantData {
  name: string;
  description?: string;
  isActive?: boolean;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

interface UpdateMandantData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export class UserService {
  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    mandantId: string;
  }): Promise<User> {
    const { email, password, firstName, lastName, role, mandantId } = userData;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw createError('User with this email already exists', 409);
    }

    const hashedPassword = await AuthService.hashPassword(password);
    const userId = uuidv4();

    const query = `
      INSERT INTO users (id, email, password, first_name, last_name, role, mandant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at, mfa_enabled
    `;

    const { rows } = await pool.query(query, [
      userId,
      email,
      hashedPassword,
      firstName,
      lastName,
      role,
      mandantId,
    ]);

    return rows[0];
  }

  static async getUsersByMandant(mandantId: string): Promise<User[]> {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.mandant_id, 
             u.is_active, u.created_at, u.updated_at, u.mfa_enabled,
             m.name as mandant_name
      FROM users u
      JOIN mandanten m ON u.mandant_id = m.id
      WHERE u.mandant_id = $1
      ORDER BY u.created_at DESC
    `;

    const { rows } = await pool.query(query, [mandantId]);
    return rows;
  }

  static async getAllUsers(isSystemAdmin: boolean, userMandantId: string): Promise<User[]> {
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.mandant_id, 
             u.is_active, u.created_at, u.updated_at, u.mfa_enabled,
             m.name as mandant_name
      FROM users u
      JOIN mandanten m ON u.mandant_id = m.id
    `;

    const values = [];
    if (!isSystemAdmin) {
      query += ' WHERE u.mandant_id = $1';
      values.push(userMandantId);
    }

    query += ' ORDER BY m.name, u.created_at DESC';

    const { rows } = await pool.query(query, values);
    return rows;
  }

  static async getUserById(id: string, mandantId: string | null, isSystemAdmin: boolean): Promise<User> {
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.mandant_id, 
             u.is_active, u.created_at, u.updated_at, u.mfa_enabled,
             m.name as mandant_name
      FROM users u
      JOIN mandanten m ON u.mandant_id = m.id
      WHERE u.id = $1
    `;

    const values = [id];
    if (!isSystemAdmin && mandantId) {
      query += ' AND u.mandant_id = $2';
      values.push(mandantId);
    }

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw createError('User not found', 404);
    }

    return rows[0];
  }

  static async updateUser(
    id: string,
    mandantId: string | null,
    isSystemAdmin: boolean,
    updateData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
      mandantId: string;
    }>
  ): Promise<User> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [updateData.email, id]
      );
      if (emailCheck.rows.length > 0) {
        throw createError('Email already in use', 409);
      }
      fields.push(`email = $${paramCount++}`);
      values.push(updateData.email);
    }
    if (updateData.firstName) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updateData.firstName);
    }
    if (updateData.lastName) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updateData.lastName);
    }
    if (updateData.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updateData.role);
    }
    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updateData.isActive);
    }
    if (updateData.mandantId && isSystemAdmin) {
      fields.push(`mandant_id = $${paramCount++}`);
      values.push(updateData.mandantId);
    }

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    let query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++}
    `;

    if (!isSystemAdmin && mandantId) {
      query += ` AND mandant_id = $${paramCount++}`;
      values.push(mandantId);
    }

    query += ' RETURNING id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at, mfa_enabled';

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw createError('User not found', 404);
    }

    return rows[0];
  }

  static async deleteUser(id: string, mandantId: string | null, isSystemAdmin: boolean): Promise<void> {
    let query = 'DELETE FROM users WHERE id = $1';
    const values = [id];

    if (!isSystemAdmin && mandantId) {
      query += ' AND mandant_id = $2';
      values.push(mandantId);
    }

    const { rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      throw createError('User not found', 404);
    }

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
  }

  static async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await AuthService.hashPassword(newPassword);

    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    await AuthService.revokeAllTokens(userId);
  }

  static async resetPassword(email: string): Promise<{ newPassword: string }> {
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await AuthService.hashPassword(newPassword);

    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404);
    }

    await AuthService.revokeAllTokens(result.rows[0].id);

    return { newPassword };
  }

  static async getAllMandanten(includeInactive = false): Promise<any[]> {
    const query = `
      SELECT 
        m.id, m.name, m.description, m.is_active, 
        m.created_at, m.updated_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count
      FROM mandanten m
      LEFT JOIN users u ON m.id = u.mandant_id AND u.is_active = true
      ${includeInactive ? '' : 'WHERE m.is_active = true'}
      GROUP BY m.id, m.name, m.description, m.is_active, m.created_at, m.updated_at
      ORDER BY m.name
    `;

    const { rows } = await pool.query(query);
    return rows;
  }

  static async getMandantById(mandantId: string): Promise<any> {
    const query = `
      SELECT 
        m.id, m.name, m.description, m.is_active, 
        m.created_at, m.updated_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count
      FROM mandanten m
      LEFT JOIN users u ON m.id = u.mandant_id AND u.is_active = true
      WHERE m.id = $1
      GROUP BY m.id, m.name, m.description, m.is_active, m.created_at, m.updated_at
    `;

    const { rows } = await pool.query(query, [mandantId]);

    if (rows.length === 0) {
      throw createError('Mandant not found', 404);
    }

    return rows[0];
  }

  static async createMandant(data: CreateMandantData): Promise<{ mandant: any; adminUser: User }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingMandant = await client.query(
        'SELECT id FROM mandanten WHERE name = $1',
        [data.name]
      );

      if (existingMandant.rows.length > 0) {
        throw createError('Mandant with this name already exists', 409);
      }

      const mandantId = uuidv4();
      const mandantQuery = `
        INSERT INTO mandanten (id, name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, description, is_active, created_at, updated_at
      `;

      const mandantResult = await client.query(mandantQuery, [
        mandantId,
        data.name,
        data.description || null,
        data.isActive !== false
      ]);

      const adminUser = await this.createUser({
        email: data.adminEmail,
        password: data.adminPassword,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        role: 'admin' as UserRole,
        mandantId: mandantId
      });

      await client.query('COMMIT');

      return {
        mandant: mandantResult.rows[0],
        adminUser
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateMandant(mandantId: string, data: UpdateMandantData): Promise<any> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
      const nameCheck = await pool.query(
        'SELECT id FROM mandanten WHERE name = $1 AND id != $2',
        [data.name, mandantId]
      );
      if (nameCheck.rows.length > 0) {
        throw createError('Mandant name already in use', 409);
      }
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    fields.push(`updated_at = NOW()`);
    values.push(mandantId);

    const updateQuery = `
      UPDATE mandanten 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, is_active, created_at, updated_at
    `;

    const { rows } = await pool.query(updateQuery, values);

    if (rows.length === 0) {
      throw createError('Mandant not found', 404);
    }

    return rows[0];
  }

  static async deleteMandant(mandantId: string): Promise<void> {
    const userCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE mandant_id = $1',
      [mandantId]
    );

    if (parseInt(userCheck.rows[0].count) > 0) {
      throw createError('Cannot delete mandant with existing users', 409);
    }

    const { rowCount } = await pool.query(
      'DELETE FROM mandanten WHERE id = $1',
      [mandantId]
    );

    if (rowCount === 0) {
      throw createError('Mandant not found', 404);
    }
  }

  static async getUserStatistics(mandantId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'techniker' THEN 1 END) as techniker_count,
        COUNT(CASE WHEN role = 'aufnehmer' THEN 1 END) as aufnehmer_count,
        COUNT(CASE WHEN mfa_enabled = true THEN 1 END) as mfa_enabled_count
      FROM users
    `;

    const values = [];
    if (mandantId) {
      query += ' WHERE mandant_id = $1';
      values.push(mandantId);
    }

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}