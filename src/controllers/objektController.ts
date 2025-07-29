import { Request, Response } from 'express';
import pool from '@/config/database';
import { AuthRequest } from '@/types';

// Get all Objekte
export const getObjekte = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mandant_id = req.user?.mandantId || req.mandantId;
    const { liegenschaft_id } = req.query;
    
    let query = `
      SELECT 
        o.*,
        l.name as liegenschaft_name,
        COUNT(DISTINCT a.id) as anlagen_count
      FROM objekte o
      LEFT JOIN liegenschaften l ON l.id = o.liegenschaft_id
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE l.mandant_id = $1
    `;
    
    const values = [mandant_id];
    
    if (liegenschaft_id) {
      query += ` AND o.liegenschaft_id = $2`;
      values.push(liegenschaft_id as string);
    }
    
    query += ` GROUP BY o.id, l.name ORDER BY l.name, o.name`;
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching objekte:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single Objekt
export const getObjekt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    
    const query = `
      SELECT 
        o.*,
        l.name as liegenschaft_name,
        COUNT(DISTINCT a.id) as anlagen_count
      FROM objekte o
      LEFT JOIN liegenschaften l ON l.id = o.liegenschaft_id
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE o.id = $1 AND l.mandant_id = $2
      GROUP BY o.id, l.name
    `;
    
    const result = await pool.query(query, [id, mandant_id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Objekt not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching objekt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new Objekt
export const createObjekt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mandant_id = req.user?.mandantId || req.mandantId;
    const { liegenschaft_id, name, description, floor, room } = req.body;
    
    if (!liegenschaft_id || !name) {
      res.status(400).json({ message: 'Liegenschaft ID and name are required' });
      return;
    }
    
    // Verify liegenschaft belongs to mandant
    const checkQuery = `
      SELECT id FROM liegenschaften 
      WHERE id = $1 AND mandant_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [liegenschaft_id, mandant_id]);
    
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: 'Liegenschaft not found' });
      return;
    }
    
    const query = `
      INSERT INTO objekte (liegenschaft_id, name, description, floor, room)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      liegenschaft_id, 
      name, 
      description, 
      floor, 
      room
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating objekt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Objekt
export const updateObjekt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    const { name, description, floor, room, is_active } = req.body;
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (floor !== undefined) {
      fields.push(`floor = $${paramCount++}`);
      values.push(floor);
    }
    if (room !== undefined) {
      fields.push(`room = $${paramCount++}`);
      values.push(room);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    
    if (fields.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, mandant_id);
    
    const query = `
      UPDATE objekte o
      SET ${fields.join(', ')}
      FROM liegenschaften l
      WHERE o.id = $${paramCount} 
        AND o.liegenschaft_id = l.id 
        AND l.mandant_id = $${paramCount + 1}
      RETURNING o.*
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Objekt not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating objekt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Objekt
export const deleteObjekt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    
    // Check if there are any anlagen
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM anlagen
      WHERE objekt_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      res.status(400).json({ 
        message: 'Cannot delete Objekt with existing Anlagen. Please delete all Anlagen first.' 
      });
      return;
    }
    
    const query = `
      DELETE FROM objekte o
      USING liegenschaften l
      WHERE o.id = $1 
        AND o.liegenschaft_id = l.id 
        AND l.mandant_id = $2
      RETURNING o.id
    `;
    
    const result = await pool.query(query, [id, mandant_id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Objekt not found' });
      return;
    }
    
    res.json({ message: 'Objekt deleted successfully' });
  } catch (error) {
    console.error('Error deleting objekt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get or create Objekt by name (for import)
export const getOrCreateObjekt = async (
  name: string, 
  liegenschaft_id: string,
  mandant_id: string,
  floor?: string,
  room?: string
): Promise<string> => {
  try {
    // First check if it exists
    const checkQuery = `
      SELECT id FROM objekte 
      WHERE LOWER(name) = LOWER($1) 
        AND liegenschaft_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [name, liegenschaft_id]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0].id;
    }
    
    // Create new
    const createQuery = `
      INSERT INTO objekte (liegenschaft_id, name, floor, room)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const createResult = await pool.query(createQuery, [
      liegenschaft_id, 
      name, 
      floor,
      room
    ]);
    
    return createResult.rows[0].id;
  } catch (error) {
    console.error('Error in getOrCreateObjekt:', error);
    throw error;
  }
};