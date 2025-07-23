import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Anlage, AnlageStatus } from '@/types';
import { createError } from '@/middleware/errorHandler';
import { AksService } from './aksService';
import { AksFieldValue } from '@/types/aks';

export class AnlageService {
  static async createAnlage(
    anlageData: {
      objektId: string;
      tNummer?: string;
      aksCode: string;
      name: string;
      description?: string;
      status: AnlageStatus;
      zustandsBewertung: number;
      dynamicFields?: Record<string, any>;
      aksFieldValues?: AksFieldValue[];
    },
    mandantId: string
  ): Promise<Anlage> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const objektQuery = `
        SELECT o.id 
        FROM objekte o
        JOIN liegenschaften l ON o.liegenschaft_id = l.id
        WHERE o.id = $1 AND l.mandant_id = $2
      `;
      
      const objektResult = await client.query(objektQuery, [anlageData.objektId, mandantId]);
      
      if (objektResult.rows.length === 0) {
        throw createError('Objekt not found or not accessible', 404);
      }

      const anlageId = uuidv4();
      const qrCodeData = `ANLAGE:${anlageId}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);

      const insertQuery = `
        INSERT INTO anlagen (
          id, objekt_id, t_nummer, aks_code, qr_code, name, description, 
          status, zustands_bewertung, dynamic_fields
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const { rows } = await client.query(insertQuery, [
        anlageId,
        anlageData.objektId,
        anlageData.tNummer,
        anlageData.aksCode,
        qrCode,
        anlageData.name,
        anlageData.description,
        anlageData.status,
        anlageData.zustandsBewertung,
        JSON.stringify(anlageData.dynamicFields || {}),
      ]);

      const anlage = rows[0];

      // Validate and save AKS field values if provided
      if (anlageData.aksFieldValues && anlageData.aksFieldValues.length > 0) {
        // Validate fields first
        const validationResult = await AksService.validateAksFields(
          anlageData.aksCode,
          anlageData.aksFieldValues
        );

        if (!validationResult.isValid) {
          throw createError(
            `AKS validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
            400
          );
        }

        // Save field values
        await AksService.saveAnlageAksValues(anlageId, anlageData.aksFieldValues);
      }

      await client.query('COMMIT');
      return anlage;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAnlagenByMandant(mandantId: string): Promise<Anlage[]> {
    const query = `
      SELECT a.*, o.name as objekt_name, l.name as liegenschaft_name
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE l.mandant_id = $1 AND a.is_active = true
      ORDER BY a.created_at DESC
    `;

    const { rows } = await pool.query(query, [mandantId]);
    return rows;
  }

  static async getAnlageById(id: string, mandantId: string): Promise<Anlage & { aksFieldValues?: AksFieldValue[] }> {
    const query = `
      SELECT a.*, o.name as objekt_name, l.name as liegenschaft_name
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE a.id = $1 AND l.mandant_id = $2 AND a.is_active = true
    `;

    const { rows } = await pool.query(query, [id, mandantId]);

    if (rows.length === 0) {
      throw createError('Anlage not found', 404);
    }

    const anlage = rows[0];

    // Get AKS field values for this Anlage
    try {
      const aksFieldValues = await AksService.getAnlageAksValues(id);
      anlage.aksFieldValues = aksFieldValues;
    } catch (error) {
      // If AKS values cannot be retrieved, continue without them
      console.warn(`Could not retrieve AKS values for Anlage ${id}:`, error.message);
    }

    return anlage;
  }

  static async getAnlageByQrCode(qrCode: string, mandantId: string): Promise<Anlage> {
    const query = `
      SELECT a.*, o.name as objekt_name, l.name as liegenschaft_name
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE a.qr_code = $1 AND l.mandant_id = $2 AND a.is_active = true
    `;

    const { rows } = await pool.query(query, [qrCode, mandantId]);

    if (rows.length === 0) {
      throw createError('Anlage not found', 404);
    }

    return rows[0];
  }

  static async updateAnlage(
    id: string,
    mandantId: string,
    updateData: Partial<{
      tNummer: string;
      aksCode: string;
      name: string;
      description: string;
      status: AnlageStatus;
      zustandsBewertung: number;
      dynamicFields: Record<string, any>;
      isActive: boolean;
    }>
  ): Promise<Anlage> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const checkQuery = `
        SELECT a.id 
        FROM anlagen a
        JOIN objekte o ON a.objekt_id = o.id
        JOIN liegenschaften l ON o.liegenschaft_id = l.id
        WHERE a.id = $1 AND l.mandant_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [id, mandantId]);
      
      if (checkResult.rows.length === 0) {
        throw createError('Anlage not found or not accessible', 404);
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.tNummer !== undefined) {
        fields.push(`t_nummer = $${paramCount++}`);
        values.push(updateData.tNummer);
      }
      if (updateData.aksCode) {
        fields.push(`aks_code = $${paramCount++}`);
        values.push(updateData.aksCode);
      }
      if (updateData.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      if (updateData.status) {
        fields.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }
      if (updateData.zustandsBewertung) {
        fields.push(`zustands_bewertung = $${paramCount++}`);
        values.push(updateData.zustandsBewertung);
      }
      if (updateData.dynamicFields) {
        fields.push(`dynamic_fields = $${paramCount++}`);
        values.push(JSON.stringify(updateData.dynamicFields));
      }
      if (updateData.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updateData.isActive);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400);
      }

      values.push(id);

      const updateQuery = `
        UPDATE anlagen
        SET ${fields.join(', ')}
        WHERE id = $${paramCount++}
        RETURNING *
      `;

      const { rows } = await client.query(updateQuery, values);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteAnlage(id: string, mandantId: string): Promise<void> {
    const checkQuery = `
      SELECT a.id 
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE a.id = $1 AND l.mandant_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, mandantId]);
    
    if (checkResult.rows.length === 0) {
      throw createError('Anlage not found or not accessible', 404);
    }

    const { rowCount } = await pool.query(
      'UPDATE anlagen SET is_active = false WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw createError('Anlage not found', 404);
    }
  }

  static async searchAnlagen(
    mandantId: string,
    filters: {
      objektId?: string;
      status?: AnlageStatus;
      aksCode?: string;
      zustandsBewertung?: number;
      search?: string;
    }
  ): Promise<Anlage[]> {
    let query = `
      SELECT a.*, o.name as objekt_name, l.name as liegenschaft_name
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE l.mandant_id = $1 AND a.is_active = true
    `;
    
    const values = [mandantId];
    let paramCount = 2;

    if (filters.objektId) {
      query += ` AND a.objekt_id = $${paramCount++}`;
      values.push(filters.objektId);
    }

    if (filters.status) {
      query += ` AND a.status = $${paramCount++}`;
      values.push(filters.status);
    }

    if (filters.aksCode) {
      query += ` AND a.aks_code ILIKE $${paramCount++}`;
      values.push(`%${filters.aksCode}%`);
    }

    if (filters.zustandsBewertung !== undefined) {
      query += ` AND a.zustands_bewertung = $${paramCount++}`;
      values.push(filters.zustandsBewertung.toString());
    }

    if (filters.search) {
      query += ` AND (a.name ILIKE $${paramCount} OR a.description ILIKE $${paramCount + 1})`;
      values.push(`%${filters.search}%`, `%${filters.search}%`);
      paramCount += 2;
    }

    query += ` ORDER BY a.created_at DESC`;

    const { rows } = await pool.query(query, values);
    return rows;
  }
}