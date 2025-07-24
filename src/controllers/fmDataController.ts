import { Request, Response } from 'express';
import pool from '@/config/database';
import { AuthRequest } from '@/types';

// Get all Liegenschaften with their buildings
export const getLiegenschaften = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mandant_id = req.user?.mandantId || req.mandantId;

    const query = `
      SELECT DISTINCT 
        l.id,
        l.name,
        COUNT(DISTINCT o.id) as building_count,
        COUNT(DISTINCT a.id) as anlage_count
      FROM liegenschaften l
      LEFT JOIN objekte o ON o.liegenschaft_id = l.id
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE l.mandant_id = $1 AND l.is_active = true
      GROUP BY l.id, l.name
      ORDER BY l.name
    `;

    const result = await pool.query(query, [mandant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liegenschaften:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get buildings for a specific Liegenschaft
export const getBuildings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liegenschaftId } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;

    const query = `
      SELECT 
        o.id,
        o.name,
        COUNT(DISTINCT a.id) as anlage_count
      FROM objekte o
      LEFT JOIN anlagen a ON a.objekt_id = o.id
      WHERE o.liegenschaft_id = $1 
        AND o.mandant_id = $2 
        AND o.is_active = true
      GROUP BY o.id, o.name
      ORDER BY o.name
    `;

    const result = await pool.query(query, [liegenschaftId, mandant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get AKS tree for a specific building (only AKS codes that have anlagen)
export const getAksTreeForBuilding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { buildingId } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;

    // First, get all AKS codes that have anlagen in this building
    const aksWithAnlagenQuery = `
      SELECT DISTINCT 
        aks.code,
        aks.name,
        aks.description,
        aks.level,
        aks.parent_code,
        aks.is_category,
        aks.sort_order,
        COUNT(a.id) as anlage_count
      FROM aks_codes aks
      INNER JOIN anlagen a ON a.aks_code = aks.code
      WHERE a.objekt_id = $1 
        AND a.mandant_id = $2 
        AND a.is_active = true
        AND aks.is_active = true
      GROUP BY aks.code, aks.name, aks.description, aks.level, aks.parent_code, aks.is_category, aks.sort_order
    `;

    const aksWithAnlagen = await pool.query(aksWithAnlagenQuery, [buildingId, mandant_id]);
    const aksCodesWithAnlagen = aksWithAnlagen.rows.map(row => row.code);

    if (aksCodesWithAnlagen.length === 0) {
      res.json([]);
      return;
    }

    // Get the complete AKS tree including parent categories
    const aksTreeQuery = `
      WITH RECURSIVE aks_tree AS (
        -- Start with AKS codes that have anlagen
        SELECT DISTINCT
          aks.id,
          aks.code,
          aks.name,
          aks.description,
          aks.level,
          aks.parent_code,
          aks.is_category,
          aks.sort_order,
          aks.maintenance_interval_months,
          CASE 
            WHEN aks.code = ANY($3::varchar[]) THEN 
              (SELECT COUNT(*) FROM anlagen a WHERE a.aks_code = aks.code AND a.objekt_id = $1 AND a.is_active = true)
            ELSE 0
          END as direct_anlage_count
        FROM aks_codes aks
        WHERE aks.code = ANY($3::varchar[])
          AND aks.is_active = true
        
        UNION
        
        -- Get all parent categories recursively
        SELECT DISTINCT
          parent.id,
          parent.code,
          parent.name,
          parent.description,
          parent.level,
          parent.parent_code,
          parent.is_category,
          parent.sort_order,
          parent.maintenance_interval_months,
          0 as direct_anlage_count
        FROM aks_codes parent
        INNER JOIN aks_tree child ON parent.code = child.parent_code
        WHERE parent.is_active = true
      )
      SELECT DISTINCT
        at.*,
        EXISTS(
          SELECT 1 FROM aks_tree child 
          WHERE child.parent_code = at.code
        ) as has_children,
        (
          SELECT COUNT(DISTINCT a.id) 
          FROM anlagen a 
          INNER JOIN aks_tree descendant ON a.aks_code = descendant.code
          WHERE descendant.code LIKE at.code || '%'
            AND a.objekt_id = $1
            AND a.is_active = true
        ) as total_anlage_count
      FROM aks_tree at
      ORDER BY at.code
    `;

    const result = await pool.query(aksTreeQuery, [buildingId, mandant_id, aksCodesWithAnlagen]);
    
    // Build hierarchical structure
    const aksMap = new Map();
    const rootNodes: any[] = [];

    // First pass: create all nodes
    result.rows.forEach(row => {
      aksMap.set(row.code, {
        ...row,
        children: []
      });
    });

    // Second pass: build tree structure
    result.rows.forEach(row => {
      const node = aksMap.get(row.code);
      if (row.parent_code && aksMap.has(row.parent_code)) {
        const parent = aksMap.get(row.parent_code);
        parent.children.push(node);
      } else if (!row.parent_code) {
        rootNodes.push(node);
      }
    });

    res.json(rootNodes);
  } catch (error) {
    console.error('Error fetching AKS tree:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get anlagen for a specific AKS code in a building
export const getAnlagenForAks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { buildingId, aksCode } = req.params;
    const mandant_id = req.user?.mandantId || req.mandantId;

    const query = `
      SELECT 
        a.id,
        a.name,
        a.t_nummer,
        a.aks_code,
        a.description,
        a.status,
        a.zustands_bewertung,
        a.qr_code,
        a.dynamic_fields,
        aks.name as aks_name,
        aks.maintenance_interval_months
      FROM anlagen a
      INNER JOIN aks_codes aks ON aks.code = a.aks_code
      WHERE a.objekt_id = $1 
        AND a.aks_code = $2
        AND a.mandant_id = $3
        AND a.is_active = true
      ORDER BY a.name
    `;

    const result = await pool.query(query, [buildingId, aksCode, mandant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching anlagen:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};