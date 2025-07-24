import { Request, Response } from 'express';
import pool from '@/config/database';
import { AuthRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

// Get all Liegenschaften for the user's mandant
export const getLiegenschaften = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mandant_id = req.user?.mandantId || req.mandantId;
    
    const query = `
      SELECT 
        l.*,
        COUNT(DISTINCT o.id) as objekte_count,
        COUNT(DISTINCT a.id) as anlagen_count
      FROM liegenschaften l
      LEFT JOIN objekte o ON o.liegenschaft_id = l.id
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE l.mandant_id = $1
      GROUP BY l.id
      ORDER BY l.name
    `;
    
    const result = await pool.query(query, [mandant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liegenschaften:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single Liegenschaft
export const getLiegenschaft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    
    const query = `
      SELECT 
        l.*,
        COUNT(DISTINCT o.id) as objekte_count,
        COUNT(DISTINCT a.id) as anlagen_count
      FROM liegenschaften l
      LEFT JOIN objekte o ON o.liegenschaft_id = l.id
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE l.id = $1 AND l.mandant_id = $2
      GROUP BY l.id
    `;
    
    const result = await pool.query(query, [id, mandant_id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Liegenschaft not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching liegenschaft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new Liegenschaft
export const createLiegenschaft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mandant_id = req.user?.mandantId || req.mandantId;
    const { name, address, description } = req.body;
    
    if (!name || !address) {
      res.status(400).json({ message: 'Name and address are required' });
      return;
    }
    
    const query = `
      INSERT INTO liegenschaften (mandant_id, name, address, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [mandant_id, name, address, description]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating liegenschaft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Liegenschaft
export const updateLiegenschaft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    const { name, address, description, is_active } = req.body;
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(description);
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
      UPDATE liegenschaften
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND mandant_id = $${paramCount + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Liegenschaft not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating liegenschaft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Liegenschaft
export const deleteLiegenschaft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;
    
    // Check if there are any objekte
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM objekte
      WHERE liegenschaft_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      res.status(400).json({ 
        message: 'Cannot delete Liegenschaft with existing Objekte. Please delete all Objekte first.' 
      });
      return;
    }
    
    const query = `
      DELETE FROM liegenschaften
      WHERE id = $1 AND mandant_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, mandant_id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Liegenschaft not found' });
      return;
    }
    
    res.json({ message: 'Liegenschaft deleted successfully' });
  } catch (error) {
    console.error('Error deleting liegenschaft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get or create Liegenschaft by name (for import)
export const getOrCreateLiegenschaft = async (
  name: string, 
  mandant_id: string,
  address?: string
): Promise<string> => {
  try {
    // First check if it exists
    const checkQuery = `
      SELECT id FROM liegenschaften 
      WHERE LOWER(name) = LOWER($1) AND mandant_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [name, mandant_id]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0].id;
    }
    
    // Create new
    const createQuery = `
      INSERT INTO liegenschaften (mandant_id, name, address)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const createResult = await pool.query(createQuery, [
      mandant_id, 
      name, 
      address || `Adresse für ${name}`
    ]);
    
    return createResult.rows[0].id;
  } catch (error) {
    console.error('Error in getOrCreateLiegenschaft:', error);
    throw error;
  }
};