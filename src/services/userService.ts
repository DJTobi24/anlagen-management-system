import pool from '@/config/database';
import { AuthService } from './authService';
import { User, UserRole } from '@/types';
import { createError } from '@/middleware/errorHandler';

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

    const query = `
      INSERT INTO users (email, password, first_name, last_name, role, mandant_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at
    `;

    const { rows } = await pool.query(query, [
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
      SELECT id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at
      FROM users
      WHERE mandant_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [mandantId]);
    return rows;
  }

  static async getUserById(id: string, mandantId: string): Promise<User> {
    const query = `
      SELECT id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND mandant_id = $2
    `;

    const { rows } = await pool.query(query, [id, mandantId]);

    if (rows.length === 0) {
      throw createError('User not found', 404);
    }

    return rows[0];
  }

  static async updateUser(
    id: string,
    mandantId: string,
    updateData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
    }>
  ): Promise<User> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.email) {
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

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    values.push(id, mandantId);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND mandant_id = $${paramCount++}
      RETURNING id, email, first_name, last_name, role, mandant_id, is_active, created_at, updated_at
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw createError('User not found', 404);
    }

    return rows[0];
  }

  static async deleteUser(id: string, mandantId: string): Promise<void> {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1 AND mandant_id = $2',
      [id, mandantId]
    );

    if (rowCount === 0) {
      throw createError('User not found', 404);
    }
  }
}