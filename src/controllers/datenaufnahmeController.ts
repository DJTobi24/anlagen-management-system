import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { UserRole } from '../types';

// Get all Datenaufnahme-Aufträge with filters
export const getDatenaufnahmen = async (req: AuthRequest, res: Response) => {
  try {
    const mandantId = req.mandantId || req.user?.mandant_id;
    const { status, zugewiesen_an, erstellt_von } = req.query;

    let query = `
      SELECT 
        da.id,
        da.titel,
        da.beschreibung,
        da.status,
        da.start_datum,
        da.end_datum,
        da.created_at,
        da.updated_at,
        da.completed_at,
        CONCAT(u1.first_name, ' ', u1.last_name) as ersteller_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as zugewiesener_name,
        (
          SELECT COUNT(DISTINCT dal.liegenschaft_id)
          FROM datenaufnahme_liegenschaften dal
          WHERE dal.aufnahme_id = da.id
        ) as anzahl_liegenschaften,
        (
          SELECT COUNT(DISTINCT dao.objekt_id)
          FROM datenaufnahme_objekte dao
          WHERE dao.aufnahme_id = da.id
        ) as anzahl_objekte,
        (
          SELECT COUNT(DISTINCT daa.anlage_id)
          FROM datenaufnahme_anlagen daa
          WHERE daa.aufnahme_id = da.id
        ) as anzahl_anlagen,
        (
          SELECT COUNT(DISTINCT daa2.anlage_id)
          FROM datenaufnahme_anlagen daa2
          WHERE daa2.aufnahme_id = da.id AND daa2.bearbeitet = true
        ) as anzahl_bearbeitet,
        (
          SELECT COUNT(DISTINCT daa3.anlage_id)
          FROM datenaufnahme_anlagen daa3
          WHERE daa3.aufnahme_id = da.id AND daa3.such_modus = true
        ) as zu_suchende_anlagen
      FROM datenaufnahme_auftraege da
      LEFT JOIN users u1 ON da.erstellt_von = u1.id
      LEFT JOIN users u2 ON da.zugewiesen_an = u2.id
      WHERE da.mandant_id = $1
    `;

    const params: any[] = [mandantId];
    let paramIndex = 2;

    // Apply filters
    if (status) {
      query += ` AND da.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (zugewiesen_an) {
      query += ` AND da.zugewiesen_an = $${paramIndex}::UUID`;
      params.push(zugewiesen_an);
      paramIndex++;
    }

    if (erstellt_von) {
      query += ` AND da.erstellt_von = $${paramIndex}::UUID`;
      params.push(erstellt_von);
      paramIndex++;
    }

    query += ' ORDER BY da.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Datenaufnahmen:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Datenaufnahmen' });
  }
};

// Get meine Aufträge (für Mitarbeiter)
export const getMeineAuftraege = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const mandantId = req.mandantId || req.user?.mandant_id;

    const query = `
      SELECT 
        da.id,
        da.titel,
        da.beschreibung,
        da.status,
        da.start_datum,
        da.end_datum,
        da.created_at,
        da.updated_at,
        CONCAT(u1.first_name, ' ', u1.last_name) as ersteller_name,
        
        -- Liegenschaften
        (
          SELECT json_agg(json_build_object(
            'id', l.id,
            'name', l.name,
            'adresse', l.address
          ))
          FROM datenaufnahme_liegenschaften dal
          INNER JOIN liegenschaften l ON l.id = dal.liegenschaft_id
          WHERE dal.aufnahme_id = da.id
        ) as liegenschaften,
        
        -- Objekte
        (
          SELECT json_agg(json_build_object(
            'id', o.id,
            'name', o.name,
            'liegenschaft_id', o.liegenschaft_id
          ))
          FROM datenaufnahme_objekte dao
          INNER JOIN objekte o ON o.id = dao.objekt_id
          WHERE dao.aufnahme_id = da.id
        ) as objekte,
        
        -- Anlagen mit Konfig
        (
          SELECT json_agg(json_build_object(
            'id', daa.id,
            'aufnahme_id', daa.aufnahme_id,
            'anlage_id', daa.anlage_id,
            'name', a.name,
            't_nummer', a.t_nummer,
            'aks_code', a.aks_code,
            'status', a.status,
            'zustands_bewertung', a.zustands_bewertung,
            'description', a.description,
            'qr_code', a.qr_code,
            'dynamic_fields', a.dynamic_fields,
            'sichtbar', daa.sichtbar,
            'such_modus', daa.such_modus,
            'notizen', daa.notizen,
            'bearbeitet', daa.bearbeitet,
            'bearbeitet_am', daa.bearbeitet_am,
            'objekt_name', o2.name,
            'liegenschaft_name', l2.name
          ))
          FROM datenaufnahme_anlagen daa
          INNER JOIN anlagen a ON a.id = daa.anlage_id
          LEFT JOIN objekte o2 ON o2.id = a.objekt_id
          LEFT JOIN liegenschaften l2 ON l2.id = o2.liegenschaft_id
          WHERE daa.aufnahme_id = da.id
        ) as anlagen
        
      FROM datenaufnahme_auftraege da
      LEFT JOIN users u1 ON da.erstellt_von = u1.id
      WHERE da.mandant_id = $1 
        AND da.zugewiesen_an = $2::UUID
        AND da.status IN ('vorbereitet', 'in_bearbeitung')
      ORDER BY da.created_at DESC
    `;

    const result = await pool.query(query, [mandantId, userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meine Aufträge:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Aufträge' });
  }
};

// Get single Datenaufnahme
export const getDatenaufnahme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mandantId = req.mandantId || req.user?.mandant_id;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const query = `
      SELECT 
        da.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as ersteller_name,
        CONCAT(u2.first_name, ' ', u2.last_name) as zugewiesener_name,
        
        -- Statistik
        json_build_object(
          'gesamt_anlagen', (
            SELECT COUNT(DISTINCT daa.anlage_id)
            FROM datenaufnahme_anlagen daa
            WHERE daa.aufnahme_id = da.id
          ),
          'bearbeitete_anlagen', (
            SELECT COUNT(DISTINCT daa.anlage_id)
            FROM datenaufnahme_anlagen daa
            WHERE daa.aufnahme_id = da.id AND daa.bearbeitet = true
          ),
          'such_modus_anlagen', (
            SELECT COUNT(DISTINCT daa.anlage_id)
            FROM datenaufnahme_anlagen daa
            WHERE daa.aufnahme_id = da.id AND daa.such_modus = true
          ),
          'fortschritt_prozent', CASE 
            WHEN (SELECT COUNT(DISTINCT daa.anlage_id) FROM datenaufnahme_anlagen daa WHERE daa.aufnahme_id = da.id) = 0 THEN 0
            ELSE ROUND(
              (SELECT COUNT(DISTINCT daa.anlage_id) FROM datenaufnahme_anlagen daa WHERE daa.aufnahme_id = da.id AND daa.bearbeitet = true)::numeric * 100 / 
              (SELECT COUNT(DISTINCT daa.anlage_id) FROM datenaufnahme_anlagen daa WHERE daa.aufnahme_id = da.id)::numeric
            )
          END
        ) as statistik,
        
        -- Liegenschaften
        (
          SELECT json_agg(json_build_object(
            'id', l.id,
            'name', l.name,
            'adresse', l.address
          ))
          FROM datenaufnahme_liegenschaften dal
          INNER JOIN liegenschaften l ON l.id = dal.liegenschaft_id
          WHERE dal.aufnahme_id = da.id
        ) as liegenschaften,
        
        -- Objekte
        (
          SELECT json_agg(json_build_object(
            'id', o.id,
            'name', o.name,
            'liegenschaft_id', o.liegenschaft_id
          ))
          FROM datenaufnahme_objekte dao
          INNER JOIN objekte o ON o.id = dao.objekt_id
          WHERE dao.aufnahme_id = da.id
        ) as objekte,
        
        -- Anlagen mit Konfig
        (
          SELECT json_agg(json_build_object(
            'id', daa.id,
            'anlage_id', daa.anlage_id,
            'sichtbar', daa.sichtbar,
            'such_modus', daa.such_modus,
            'notizen', daa.notizen,
            'anlage_name', a.name,
            't_nummer', a.t_nummer,
            'aks_code', a.aks_code,
            'bearbeitet', daa.bearbeitet,
            'bearbeitet_am', daa.bearbeitet_am
          ))
          FROM datenaufnahme_anlagen daa
          INNER JOIN anlagen a ON a.id = daa.anlage_id
          WHERE daa.aufnahme_id = da.id
        ) as anlagen
        
      FROM datenaufnahme_auftraege da
      LEFT JOIN users u1 ON da.erstellt_von = u1.id
      LEFT JOIN users u2 ON da.zugewiesen_an = u2.id
      WHERE da.id = $1::UUID AND da.mandant_id = $2
    `;

    const result = await pool.query(query, [id, mandantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
    }

    const datenaufnahme = result.rows[0];

    // Check permissions
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPERVISOR) {
      if (datenaufnahme.zugewiesen_an !== userId && datenaufnahme.erstellt_von !== userId) {
        return res.status(403).json({ message: 'Keine Berechtigung' });
      }
    }

    res.json(datenaufnahme);
  } catch (error) {
    console.error('Error fetching Datenaufnahme:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Datenaufnahme' });
  }
};

// Create new Datenaufnahme
export const createDatenaufnahme = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const {
      titel,
      beschreibung,
      zugewiesen_an,
      start_datum,
      end_datum,
      liegenschaft_ids = [],
      objekt_ids = [],
      anlagen_config = []
    } = req.body;

    const mandantId = req.mandantId || req.user?.mandant_id;
    const erstelltVon = req.user?.id;

    await client.query('BEGIN');

    // Insert Datenaufnahme
    const insertQuery = `
      INSERT INTO datenaufnahme_auftraege (
        mandant_id,
        titel,
        beschreibung,
        erstellt_von,
        zugewiesen_an,
        status,
        start_datum,
        end_datum
      ) VALUES ($1, $2, $3, $4, $5::UUID, 'vorbereitet', $6, $7)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      mandantId,
      titel,
      beschreibung,
      erstelltVon,
      zugewiesen_an,
      start_datum,
      end_datum
    ]);

    const datenaufnahmeId = result.rows[0].id;

    // Insert Liegenschaften
    if (liegenschaft_ids.length > 0) {
      const liegenschaftValues = liegenschaft_ids.map((id: string) => 
        `('${datenaufnahmeId}', '${id}')`
      ).join(',');
      
      await client.query(`
        INSERT INTO datenaufnahme_liegenschaften (aufnahme_id, liegenschaft_id)
        VALUES ${liegenschaftValues}
      `);
    }

    // Insert Objekte
    if (objekt_ids.length > 0) {
      const objektValues = objekt_ids.map((id: string) => 
        `('${datenaufnahmeId}', '${id}')`
      ).join(',');
      
      await client.query(`
        INSERT INTO datenaufnahme_objekte (aufnahme_id, objekt_id)
        VALUES ${objektValues}
      `);
    }

    // Get all Anlagen for selected Objekte/Liegenschaften
    let anlagenQuery = `
      SELECT DISTINCT a.id
      FROM anlagen a
      INNER JOIN objekte o ON a.objekt_id = o.id
      WHERE a.is_active = true
    `;

    const anlagenParams: any[] = [];
    
    if (objekt_ids.length > 0) {
      anlagenQuery += ` AND o.id = ANY($1)`;
      anlagenParams.push(objekt_ids);
    } else if (liegenschaft_ids.length > 0) {
      anlagenQuery += ` AND o.liegenschaft_id = ANY($1)`;
      anlagenParams.push(liegenschaft_ids);
    }

    const anlagenResult = await client.query(anlagenQuery, anlagenParams);
    const allAnlagenIds = anlagenResult.rows.map(row => row.id);

    // Insert Anlagen with config
    if (allAnlagenIds.length > 0) {
      // Create a map of configured anlagen
      const configMap = new Map(
        anlagen_config.map((config: any) => [config.anlage_id, config])
      );

      const anlagenValues = allAnlagenIds.map((anlageId: string) => {
        const config = configMap.get(anlageId) || {};
        return `(
          '${datenaufnahmeId}',
          '${anlageId}',
          ${config.sichtbar !== false},
          ${config.such_modus === true},
          ${config.notizen ? `'${config.notizen}'` : 'NULL'}
        )`;
      }).join(',');

      await client.query(`
        INSERT INTO datenaufnahme_anlagen (
          aufnahme_id,
          anlage_id,
          sichtbar,
          such_modus,
          notizen
        ) VALUES ${anlagenValues}
      `);
    }

    await client.query('COMMIT');

    // Fetch created Datenaufnahme with all relations
    const createdDatenaufnahme = await getDatenaufnahmeById(datenaufnahmeId, mandantId);
    
    res.status(201).json(createdDatenaufnahme);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating Datenaufnahme:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Datenaufnahme' });
  } finally {
    client.release();
  }
};

// Update Datenaufnahme
export const updateDatenaufnahme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      titel,
      beschreibung,
      zugewiesen_an,
      status,
      start_datum,
      end_datum
    } = req.body;

    const mandantId = req.mandantId || req.user?.mandant_id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check permissions
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPERVISOR) {
      const checkQuery = `
        SELECT erstellt_von, zugewiesen_an 
        FROM datenaufnahme_auftraege 
        WHERE id = $1::UUID AND mandant_id = $2
      `;
      const checkResult = await pool.query(checkQuery, [id, mandantId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
      }

      const auftrag = checkResult.rows[0];
      if (auftrag.erstellt_von !== userId && auftrag.zugewiesen_an !== userId) {
        return res.status(403).json({ message: 'Keine Berechtigung' });
      }
    }

    const updateQuery = `
      UPDATE datenaufnahme_auftraege
      SET 
        titel = COALESCE($1, titel),
        beschreibung = COALESCE($2, beschreibung),
        zugewiesen_an = COALESCE($3::UUID, zugewiesen_an),
        status = COALESCE($4, status),
        start_datum = COALESCE($5, start_datum),
        end_datum = COALESCE($6, end_datum),
        updated_at = CURRENT_TIMESTAMP,
        completed_at = CASE 
          WHEN $4 = 'abgeschlossen' AND status != 'abgeschlossen' THEN CURRENT_TIMESTAMP
          ELSE completed_at
        END
      WHERE id = $7::UUID AND mandant_id = $8
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      titel,
      beschreibung,
      zugewiesen_an,
      status,
      start_datum,
      end_datum,
      id,
      mandantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating Datenaufnahme:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Datenaufnahme' });
  }
};

// Update Anlagen configuration
export const updateAnlagenConfig = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { anlagen_config } = req.body;
    const mandantId = req.mandantId || req.user?.mandant_id;

    await client.query('BEGIN');

    // Verify Datenaufnahme exists
    const checkQuery = `
      SELECT id FROM datenaufnahme_auftraege 
      WHERE id = $1::UUID AND mandant_id = $2
    `;
    const checkResult = await client.query(checkQuery, [id, mandantId]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
    }

    // Update each Anlage config
    for (const config of anlagen_config) {
      await client.query(`
        UPDATE datenaufnahme_anlagen
        SET 
          sichtbar = $1,
          such_modus = $2,
          notizen = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE aufnahme_id = $4::UUID AND anlage_id = $5::UUID
      `, [
        config.sichtbar,
        config.such_modus,
        config.notizen,
        id,
        config.anlage_id
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Anlagen-Konfiguration aktualisiert' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating Anlagen config:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Anlagen-Konfiguration' });
  } finally {
    client.release();
  }
};

// Mark Anlage as bearbeitet
export const markAnlageBearbeitet = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { aufnahmeId, anlageId } = req.params;
    const { notizen, alte_werte, neue_werte } = req.body;
    const userId = req.user?.id;

    await client.query('BEGIN');

    // Update datenaufnahme_anlagen
    const updateQuery = `
      UPDATE datenaufnahme_anlagen
      SET 
        bearbeitet = true,
        bearbeitet_am = CURRENT_TIMESTAMP,
        notizen = COALESCE($1, notizen)
      WHERE aufnahme_id = $2::UUID AND anlage_id = $3::UUID
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      notizen,
      aufnahmeId,
      anlageId
    ]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Anlage nicht gefunden' });
    }

    // Log the change in fortschritt table
    const logQuery = `
      INSERT INTO datenaufnahme_fortschritt (
        aufnahme_id,
        anlage_id,
        aktion,
        benutzer_id,
        alte_werte,
        neue_werte
      ) VALUES ($1::UUID, $2::UUID, 'bearbeitet', $3::UUID, $4, $5)
      RETURNING *
    `;

    await client.query(logQuery, [
      aufnahmeId,
      anlageId,
      userId,
      JSON.stringify(alte_werte || {}),
      JSON.stringify(neue_werte || {})
    ]);

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking Anlage as bearbeitet:', error);
    res.status(500).json({ message: 'Fehler beim Markieren der Anlage' });
  } finally {
    client.release();
  }
};

// Add Anlage to Datenaufnahme
export const addAnlageToDatenaufnahme = async (req: AuthRequest, res: Response) => {
  try {
    const { aufnahmeId, anlageId } = req.params;
    const mandantId = req.mandantId || req.user?.mandant_id;

    // Check if Datenaufnahme exists and user has access
    const checkQuery = `
      SELECT id FROM datenaufnahme_auftraege 
      WHERE id = $1 AND mandant_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [aufnahmeId, mandantId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
    }

    // Check if Anlage exists
    const anlageCheck = `
      SELECT a.id FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE a.id = $1 AND l.mandant_id = $2
    `;
    const anlageResult = await pool.query(anlageCheck, [anlageId, mandantId]);
    
    if (anlageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Anlage nicht gefunden' });
    }

    // Add Anlage to Datenaufnahme
    const insertQuery = `
      INSERT INTO datenaufnahme_anlagen (aufnahme_id, anlage_id, sichtbar, such_modus)
      VALUES ($1, $2, true, false)
      ON CONFLICT (aufnahme_id, anlage_id) DO UPDATE 
      SET sichtbar = true, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [aufnahmeId, anlageId]);
    
    res.json({
      message: 'Anlage wurde zur Datenaufnahme hinzugefügt',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding Anlage to Datenaufnahme:', error);
    res.status(500).json({ message: 'Fehler beim Hinzufügen der Anlage' });
  }
};

// Delete Datenaufnahme
export const deleteDatenaufnahme = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mandantId = req.mandantId || req.user?.mandant_id;

    const deleteQuery = `
      DELETE FROM datenaufnahme_auftraege
      WHERE id = $1::UUID AND mandant_id = $2
      RETURNING id
    `;

    const result = await pool.query(deleteQuery, [id, mandantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Datenaufnahme nicht gefunden' });
    }

    res.json({ message: 'Datenaufnahme gelöscht', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting Datenaufnahme:', error);
    res.status(500).json({ message: 'Fehler beim Löschen der Datenaufnahme' });
  }
};

// Get Datenaufnahme Fortschritt
export const getDatenaufnahmeFortschritt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mandantId = req.mandantId || req.user?.mandant_id;

    const query = `
      SELECT 
        df.*,
        a.name as anlage_name,
        a.t_nummer,
        CONCAT(u.first_name, ' ', u.last_name) as bearbeiter_name
      FROM datenaufnahme_fortschritt df
      INNER JOIN anlagen a ON df.anlage_id = a.id
      INNER JOIN datenaufnahme_auftraege da ON df.aufnahme_id = da.id
      LEFT JOIN users u ON df.benutzer_id = u.id
      WHERE df.aufnahme_id = $1::UUID AND da.mandant_id = $2
      ORDER BY df.created_at DESC
    `;

    const result = await pool.query(query, [id, mandantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Fortschritt:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Fortschritts' });
  }
};

// Helper function to get Datenaufnahme by ID
async function getDatenaufnahmeById(id: string, mandantId: string) {
  const query = `
    SELECT 
      da.*,
      CONCAT(u1.first_name, ' ', u1.last_name) as ersteller_name,
      CONCAT(u2.first_name, ' ', u2.last_name) as zugewiesener_name,
      
      -- Liegenschaften
      (
        SELECT json_agg(json_build_object(
          'id', l.id,
          'name', l.name,
          'adresse', l.address
        ))
        FROM datenaufnahme_liegenschaften dal
        INNER JOIN liegenschaften l ON l.id = dal.liegenschaft_id
        WHERE dal.aufnahme_id = da.id
      ) as liegenschaften,
      
      -- Objekte
      (
        SELECT json_agg(json_build_object(
          'id', o.id,
          'name', o.name,
          'liegenschaft_id', o.liegenschaft_id
        ))
        FROM datenaufnahme_objekte dao
        INNER JOIN objekte o ON o.id = dao.objekt_id
        WHERE dao.aufnahme_id = da.id
      ) as objekte,
      
      -- Anlagen mit Konfig
      (
        SELECT json_agg(json_build_object(
          'id', daa.id,
          'anlage_id', daa.anlage_id,
          'sichtbar', daa.sichtbar,
          'such_modus', daa.such_modus,
          'notizen', daa.notizen,
          'anlage_name', a.name,
          't_nummer', a.t_nummer,
          'aks_code', a.aks_code
        ))
        FROM datenaufnahme_anlagen daa
        INNER JOIN anlagen a ON a.id = daa.anlage_id
        WHERE daa.aufnahme_id = da.id
      ) as anlagen
      
    FROM datenaufnahme_auftraege da
    LEFT JOIN users u1 ON da.erstellt_von = u1.id
    LEFT JOIN users u2 ON da.zugewiesen_an = u2.id
    WHERE da.id = $1::UUID AND da.mandant_id = $2
  `;

  const result = await pool.query(query, [id, mandantId]);
  return result.rows[0];
}