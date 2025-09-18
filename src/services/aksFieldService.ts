import pool from '../config/database';

export interface AksFieldDefinition {
  id?: string;
  aks_code: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'decimal' | 'date' | 'boolean' | 'select' | 'multiselect' | 'unit_value';
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
  unit?: string;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  select_options?: string[];
  validation_rules?: any;
}

export interface FieldValue {
  field_definition_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_value: string;
  numeric_value?: number;
  unit?: string;
  is_required: boolean;
}

class AksFieldService {
  /**
   * Get all field definitions for an AKS code
   */
  async getFieldsByAksCode(aksCode: string): Promise<AksFieldDefinition[]> {
    const query = `
      SELECT 
        id,
        aks_code,
        field_name,
        field_label,
        field_type,
        is_required,
        is_visible,
        display_order,
        unit,
        default_value,
        placeholder,
        help_text,
        min_value,
        max_value,
        regex_pattern,
        select_options,
        validation_rules
      FROM aks_field_definitions
      WHERE aks_code = $1 AND is_visible = true
      ORDER BY display_order, field_label
    `;
    
    const result = await pool.query(query, [aksCode]);
    return result.rows;
  }

  /**
   * Get all field definitions
   */
  async getAllFields(): Promise<AksFieldDefinition[]> {
    const query = `
      SELECT 
        afd.*,
        ak.name as aks_bezeichnung
      FROM aks_field_definitions afd
      LEFT JOIN aks_codes ak ON ak.code = afd.aks_code
      ORDER BY aks_code, display_order
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Create or update field definition
   */
  async upsertFieldDefinition(field: AksFieldDefinition): Promise<AksFieldDefinition> {
    const query = `
      INSERT INTO aks_field_definitions (
        aks_code, field_name, field_label, field_type,
        is_required, is_visible, display_order, unit,
        default_value, placeholder, help_text,
        min_value, max_value, regex_pattern,
        select_options, validation_rules
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (aks_code, field_name) 
      DO UPDATE SET
        field_label = EXCLUDED.field_label,
        field_type = EXCLUDED.field_type,
        is_required = EXCLUDED.is_required,
        is_visible = EXCLUDED.is_visible,
        display_order = EXCLUDED.display_order,
        unit = EXCLUDED.unit,
        default_value = EXCLUDED.default_value,
        placeholder = EXCLUDED.placeholder,
        help_text = EXCLUDED.help_text,
        min_value = EXCLUDED.min_value,
        max_value = EXCLUDED.max_value,
        regex_pattern = EXCLUDED.regex_pattern,
        select_options = EXCLUDED.select_options,
        validation_rules = EXCLUDED.validation_rules,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      field.aks_code,
      field.field_name,
      field.field_label,
      field.field_type,
      field.is_required,
      field.is_visible ?? true,
      field.display_order,
      field.unit,
      field.default_value,
      field.placeholder,
      field.help_text,
      field.min_value,
      field.max_value,
      field.regex_pattern,
      field.select_options ? JSON.stringify(field.select_options) : null,
      field.validation_rules ? JSON.stringify(field.validation_rules) : null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete field definition
   */
  async deleteFieldDefinition(id: string): Promise<boolean> {
    const query = 'DELETE FROM aks_field_definitions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get field values for an anlage
   */
  async getAnlageFieldValues(anlageId: string): Promise<FieldValue[]> {
    const query = `
      SELECT 
        afv.id,
        afv.field_definition_id,
        afd.field_name,
        afd.field_label,
        afd.field_type,
        afv.field_value,
        afv.numeric_value,
        COALESCE(afv.unit, afd.unit) as unit,
        afd.is_required,
        afd.help_text,
        afd.select_options,
        afd.min_value,
        afd.max_value
      FROM anlage_field_values afv
      JOIN aks_field_definitions afd ON afd.id = afv.field_definition_id
      WHERE afv.anlage_id = $1
      ORDER BY afd.display_order
    `;
    
    const result = await pool.query(query, [anlageId]);
    return result.rows;
  }

  /**
   * Save field values for an anlage
   */
  async saveAnlageFieldValues(
    anlageId: string, 
    values: Array<{field_definition_id: string, value: string, numeric_value?: number, unit?: string}>,
    userId: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete existing values
      await client.query('DELETE FROM anlage_field_values WHERE anlage_id = $1', [anlageId]);
      
      // Insert new values
      for (const fieldValue of values) {
        const query = `
          INSERT INTO anlage_field_values (
            anlage_id, field_definition_id, field_value, 
            numeric_value, unit, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $6)
        `;
        
        await client.query(query, [
          anlageId,
          fieldValue.field_definition_id,
          fieldValue.value,
          fieldValue.numeric_value,
          fieldValue.unit,
          userId
        ]);
      }
      
      // Update validation status
      await this.validateAnlageFields(anlageId, client);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate required fields for an anlage
   */
  async validateAnlageFields(anlageId: string, client?: any): Promise<{isValid: boolean, missingFields: string[]}> {
    const conn = client || pool;
    
    // Get AKS code for the anlage
    const anlageResult = await conn.query(
      'SELECT aks_schluessel FROM anlagen WHERE id = $1',
      [anlageId]
    );
    
    if (anlageResult.rows.length === 0) {
      return { isValid: false, missingFields: [] };
    }
    
    const aksCode = anlageResult.rows[0].aks_schluessel;
    
    // Get required fields for this AKS code
    const requiredFieldsResult = await conn.query(
      'SELECT id, field_name, field_label FROM aks_field_definitions WHERE aks_code = $1 AND is_required = true',
      [aksCode]
    );
    
    const requiredFields = requiredFieldsResult.rows;
    
    // Get existing field values
    const existingValuesResult = await conn.query(
      'SELECT field_definition_id FROM anlage_field_values WHERE anlage_id = $1 AND field_value IS NOT NULL AND field_value != \'\'',
      [anlageId]
    );
    
    const existingFieldIds = new Set(existingValuesResult.rows.map(r => r.field_definition_id));
    
    // Check missing fields
    const missingFields = requiredFields
      .filter(field => !existingFieldIds.has(field.id))
      .map(field => field.field_label);
    
    const isValid = missingFields.length === 0;
    
    // Update anlage validation status
    await conn.query(
      'UPDATE anlagen SET fields_validated = $1, field_validation_date = $2, missing_required_fields = $3 WHERE id = $4',
      [isValid, new Date(), JSON.stringify(missingFields), anlageId]
    );
    
    return { isValid, missingFields };
  }

  /**
   * Get field statistics for reporting
   */
  async getFieldStatistics(mandantId: string): Promise<any> {
    const query = `
      SELECT 
        ak.code,
        ak.bezeichnung,
        COUNT(DISTINCT a.id) as total_anlagen,
        COUNT(DISTINCT CASE WHEN a.fields_validated = true THEN a.id END) as validated_anlagen,
        COUNT(DISTINCT afd.id) as total_fields,
        COUNT(DISTINCT CASE WHEN afd.is_required = true THEN afd.id END) as required_fields
      FROM aks_codes ak
      LEFT JOIN anlagen a ON a.aks_schluessel = ak.code AND a.mandant_id = $1
      LEFT JOIN aks_field_definitions afd ON afd.aks_code = ak.code
      GROUP BY ak.code, ak.bezeichnung
      ORDER BY ak.code
    `;
    
    const result = await pool.query(query, [mandantId]);
    return result.rows;
  }

  /**
   * Copy field definitions from one AKS code to another
   */
  async copyFieldDefinitions(sourceAksCode: string, targetAksCode: string): Promise<void> {
    const query = `
      INSERT INTO aks_field_definitions (
        aks_code, field_name, field_label, field_type,
        is_required, is_visible, display_order, unit,
        default_value, placeholder, help_text,
        min_value, max_value, regex_pattern,
        select_options, validation_rules
      )
      SELECT 
        $2, field_name, field_label, field_type,
        is_required, is_visible, display_order, unit,
        default_value, placeholder, help_text,
        min_value, max_value, regex_pattern,
        select_options, validation_rules
      FROM aks_field_definitions
      WHERE aks_code = $1
      ON CONFLICT (aks_code, field_name) DO NOTHING
    `;
    
    await pool.query(query, [sourceAksCode, targetAksCode]);
  }
}

export default new AksFieldService();