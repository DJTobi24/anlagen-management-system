import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  AksCode,
  AksField,
  AksFieldType,
  AksDataType,
  AksValidationResult,
  AksValidationError,
  AksFieldValue,
  AksSearchParams,
  AksFieldMapping
} from '@/types/aks';
import { createError } from '@/middleware/errorHandler';

export class AksService {
  // AKS Code Management
  static async createAksCode(data: {
    code: string;
    name: string;
    description?: string;
    category?: string;
    maintenance_interval_months?: number;
    maintenance_type?: string;
    maintenance_description?: string;
  }): Promise<AksCode> {
    const { code, name, description, category, maintenance_interval_months, maintenance_type, maintenance_description } = data;

    // Check if code already exists
    const existing = await pool.query(
      'SELECT id FROM aks_codes WHERE code = $1',
      [code]
    );

    if (existing.rows.length > 0) {
      throw createError(`AKS code ${code} already exists`, 409);
    }

    const query = `
      INSERT INTO aks_codes (
        id, code, name, description, category, 
        level, parent_code, is_category, sort_order,
        maintenance_interval_months, maintenance_type, maintenance_description
      )
      VALUES (
        $1, $2, $3, $4, $5,
        calculate_aks_level($2), get_parent_aks_code($2), 
        CASE WHEN calculate_aks_level($2) < 4 THEN true ELSE false END,
        0, $6, $7, $8
      )
      RETURNING *
    `;

    const id = uuidv4();
    const { rows } = await pool.query(query, [
      id,
      code,
      name,
      description || null,
      category || null,
      maintenance_interval_months || null,
      maintenance_type || null,
      maintenance_description || null
    ]);

    return this.mapAksCode(rows[0]);
  }

  static async getAksCodeByCode(code: string): Promise<AksCode | null> {
    const query = `
      SELECT c.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', f.id,
              'aksCodeId', f.aks_code_id,
              'kasCode', f.kas_code,
              'fieldName', f.field_name,
              'displayName', f.display_name,
              'fieldType', f.field_type,
              'dataType', f.data_type,
              'unit', f.unit,
              'isRequired', f.is_required,
              'minValue', f.min_value,
              'maxValue', f.max_value,
              'minLength', f.min_length,
              'maxLength', f.max_length,
              'regex', f.regex,
              'options', f.options,
              'defaultValue', f.default_value,
              'helpText', f.help_text,
              'order', f.field_order,
              'createdAt', f.created_at,
              'updatedAt', f.updated_at
            )
            ORDER BY f.field_order
          ) FILTER (WHERE f.id IS NOT NULL), 
          '[]'
        ) as fields
      FROM aks_codes c
      LEFT JOIN aks_fields f ON c.id = f.aks_code_id
      WHERE c.code = $1 AND c.is_active = true
      GROUP BY c.id
    `;

    const { rows } = await pool.query(query, [code]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapAksCodeWithFields(rows[0]);
  }

  static async searchAksCodes(params: AksSearchParams): Promise<{
    codes: AksCode[];
    total: number;
  }> {
    let whereConditions = ['c.is_active = true'];
    const values: any[] = [];
    let paramCount = 1;

    if (params.code) {
      whereConditions.push(`c.code ILIKE $${paramCount++}`);
      values.push(`%${params.code}%`);
    }

    if (params.name) {
      whereConditions.push(`c.name ILIKE $${paramCount++}`);
      values.push(`%${params.name}%`);
    }

    if (params.category) {
      whereConditions.push(`c.category = $${paramCount++}`);
      values.push(params.category);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM aks_codes c
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results with hierarchy info
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    
    values.push(limit, offset);
    
    const query = `
      SELECT c.*, 
        COUNT(DISTINCT f.id) as field_count,
        EXISTS(SELECT 1 FROM aks_codes child WHERE child.parent_code = c.code) as has_children
      FROM aks_codes c
      LEFT JOIN aks_fields f ON c.id = f.aks_code_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.level, c.sort_order, c.code
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    const { rows } = await pool.query(query, values);

    const codes = rows.map(row => ({
      ...this.mapAksCode(row),
      fieldCount: parseInt(row.field_count, 10),
      hasChildren: row.has_children
    }));

    return { codes, total };
  }

  static async getAksTree(parentCode?: string): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      const query = `SELECT * FROM get_aks_tree($1)`;
      const result = await client.query(query, [parentCode || null]);
      
      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        level: row.level,
        parentCode: row.parent_code,
        isCategory: row.is_category,
        hasChildren: row.has_children,
        maintenanceIntervalMonths: row.maintenance_interval_months,
        path: row.path
      }));
    } finally {
      client.release();
    }
  }

  static async updateAksCode(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      isActive: boolean;
      maintenance_interval_months: number;
      maintenance_type: string;
      maintenance_description: string;
    }>
  ): Promise<AksCode> {
    const fields: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }
    if (data.maintenance_interval_months !== undefined) {
      fields.push(`maintenance_interval_months = $${paramCount++}`);
      values.push(data.maintenance_interval_months);
    }
    if (data.maintenance_type !== undefined) {
      fields.push(`maintenance_type = $${paramCount++}`);
      values.push(data.maintenance_type);
    }
    if (data.maintenance_description !== undefined) {
      fields.push(`maintenance_description = $${paramCount++}`);
      values.push(data.maintenance_description);
    }

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    const query = `
      UPDATE aks_codes
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw createError('AKS code not found', 404);
    }

    return this.mapAksCode(rows[0]);
  }

  static async deleteAksCode(id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get AKS code info for better error messages
      const aksCodeInfo = await client.query(
        'SELECT code, name FROM aks_codes WHERE id = $1',
        [id]
      );

      if (aksCodeInfo.rows.length === 0) {
        throw createError('AKS code not found', 404);
      }

      const { code, name } = aksCodeInfo.rows[0];

      // Check if AKS code has children
      const childrenCheck = await client.query(
        'SELECT code, name FROM aks_codes WHERE parent_code = $1 LIMIT 5',
        [code]
      );

      if (childrenCheck.rows.length > 0) {
        const childrenNames = childrenCheck.rows.map(child => child.name).join(', ');
        const moreText = childrenCheck.rows.length === 5 ? ' und weitere...' : '';
        throw createError(
          `Der AKS-Code "${name}" (${code}) kann nicht gelöscht werden, da er untergeordnete Elemente hat: ${childrenNames}${moreText}. Löschen Sie zuerst die untergeordneten Elemente.`, 
          400
        );
      }

      // Delete related fields first
      await client.query('DELETE FROM aks_fields WHERE aks_code_id = $1', [id]);
      
      // Delete the AKS code
      const result = await client.query('DELETE FROM aks_codes WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        throw createError('AKS code not found', 404);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async toggleAksCodeStatus(id: string): Promise<AksCode> {
    const query = `
      UPDATE aks_codes
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      throw createError('AKS code not found', 404);
    }

    return this.mapAksCode(rows[0]);
  }

  static async bulkDeleteAksCodes(ids: string[]): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const client = await pool.connect();
    const results = {
      successCount: 0,
      failureCount: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    try {
      await client.query('BEGIN');

      for (const id of ids) {
        try {
          // Get AKS code info for better error messages
          const aksCodeInfo = await client.query(
            'SELECT code, name FROM aks_codes WHERE id = $1',
            [id]
          );

          if (aksCodeInfo.rows.length === 0) {
            results.errors.push({
              id,
              error: 'AKS code not found'
            });
            results.failureCount++;
            continue;
          }

          const { code, name } = aksCodeInfo.rows[0];

          // Check if AKS code has children
          const childrenCheck = await client.query(
            'SELECT COUNT(*) as child_count FROM aks_codes WHERE parent_code = $1',
            [code]
          );

          const childCount = parseInt(childrenCheck.rows[0].child_count);
          if (childCount > 0) {
            results.errors.push({
              id,
              error: `"${name}" (${code}) hat ${childCount} untergeordnete Elemente`
            });
            results.failureCount++;
            continue;
          }

          // Delete related fields first
          await client.query('DELETE FROM aks_fields WHERE aks_code_id = $1', [id]);
          
          // Delete the AKS code
          const result = await client.query('DELETE FROM aks_codes WHERE id = $1', [id]);

          if (result.rowCount === 0) {
            results.errors.push({
              id,
              error: 'AKS code not found'
            });
            results.failureCount++;
          } else {
            results.successCount++;
          }
        } catch (error: any) {
          results.errors.push({
            id,
            error: error.message || 'Unknown error'
          });
          results.failureCount++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }

  static async bulkToggleAksCodesStatus(ids: string[], isActive: boolean): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const client = await pool.connect();
    const results = {
      successCount: 0,
      failureCount: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    try {
      await client.query('BEGIN');

      for (const id of ids) {
        try {
          const result = await client.query(
            'UPDATE aks_codes SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [isActive, id]
          );

          if (result.rowCount === 0) {
            results.errors.push({
              id,
              error: 'AKS code not found'
            });
            results.failureCount++;
          } else {
            results.successCount++;
          }
        } catch (error: any) {
          results.errors.push({
            id,
            error: error.message || 'Unknown error'
          });
          results.failureCount++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }

  static async bulkUpdateAksCodes(ids: string[], updateData: {
    category?: string;
    maintenance_interval_months?: number;
    maintenance_type?: string;
    maintenance_description?: string;
  }): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const client = await pool.connect();
    const results = {
      successCount: 0,
      failureCount: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    // Build dynamic update query
    const fields = [];
    const baseValues = [];
    let paramCount = 1;

    if (updateData.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      baseValues.push(updateData.category);
    }
    if (updateData.maintenance_interval_months !== undefined) {
      fields.push(`maintenance_interval_months = $${paramCount++}`);
      baseValues.push(updateData.maintenance_interval_months);
    }
    if (updateData.maintenance_type !== undefined) {
      fields.push(`maintenance_type = $${paramCount++}`);
      baseValues.push(updateData.maintenance_type);
    }
    if (updateData.maintenance_description !== undefined) {
      fields.push(`maintenance_description = $${paramCount++}`);
      baseValues.push(updateData.maintenance_description);
    }

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    const updateQuery = `
      UPDATE aks_codes
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
    `;

    try {
      await client.query('BEGIN');

      for (const id of ids) {
        try {
          const values = [...baseValues, id];
          const result = await client.query(updateQuery, values);

          if (result.rowCount === 0) {
            results.errors.push({
              id,
              error: 'AKS code not found'
            });
            results.failureCount++;
          } else {
            results.successCount++;
          }
        } catch (error: any) {
          results.errors.push({
            id,
            error: error.message || 'Unknown error'
          });
          results.failureCount++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }

  // AKS Field Management
  static async createAksField(
    aksCodeId: string,
    fieldData: {
      kasCode: string;
      fieldName: string;
      displayName: string;
      fieldType: AksFieldType;
      dataType: AksDataType;
      unit?: string;
      isRequired: boolean;
      minValue?: number;
      maxValue?: number;
      minLength?: number;
      maxLength?: number;
      regex?: string;
      options?: any[];
      defaultValue?: any;
      helpText?: string;
      order?: number;
    }
  ): Promise<AksField> {
    // Check if field already exists
    const existing = await pool.query(
      'SELECT id FROM aks_fields WHERE aks_code_id = $1 AND kas_code = $2',
      [aksCodeId, fieldData.kasCode]
    );

    if (existing.rows.length > 0) {
      throw createError(`Field ${fieldData.kasCode} already exists for this AKS code`, 409);
    }

    const query = `
      INSERT INTO aks_fields (
        id, aks_code_id, kas_code, field_name, display_name, field_type,
        data_type, unit, is_required, min_value, max_value, min_length,
        max_length, regex, options, default_value, help_text, field_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const id = uuidv4();
    const { rows } = await pool.query(query, [
      id,
      aksCodeId,
      fieldData.kasCode,
      fieldData.fieldName,
      fieldData.displayName,
      fieldData.fieldType,
      fieldData.dataType,
      fieldData.unit || null,
      fieldData.isRequired,
      fieldData.minValue || null,
      fieldData.maxValue || null,
      fieldData.minLength || null,
      fieldData.maxLength || null,
      fieldData.regex || null,
      JSON.stringify(fieldData.options || []),
      fieldData.defaultValue || null,
      fieldData.helpText || null,
      fieldData.order || 0
    ]);

    return this.mapAksField(rows[0]);
  }

  static async updateAksField(
    id: string,
    fieldData: Partial<{
      displayName: string;
      isRequired: boolean;
      minValue?: number;
      maxValue?: number;
      minLength?: number;
      maxLength?: number;
      regex?: string;
      options?: any[];
      defaultValue?: any;
      helpText?: string;
      order?: number;
    }>
  ): Promise<AksField> {
    const fields = [];
    const values = [id];
    let paramCount = 2;

    if (fieldData.displayName !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(fieldData.displayName);
    }
    if (fieldData.isRequired !== undefined) {
      fields.push(`is_required = $${paramCount++}`);
      values.push(fieldData.isRequired.toString());
    }
    if (fieldData.minValue !== undefined) {
      fields.push(`min_value = $${paramCount++}`);
      values.push(fieldData.minValue.toString());
    }
    if (fieldData.maxValue !== undefined) {
      fields.push(`max_value = $${paramCount++}`);
      values.push(fieldData.maxValue.toString());
    }
    if (fieldData.minLength !== undefined) {
      fields.push(`min_length = $${paramCount++}`);
      values.push(fieldData.minLength.toString());
    }
    if (fieldData.maxLength !== undefined) {
      fields.push(`max_length = $${paramCount++}`);
      values.push(fieldData.maxLength.toString());
    }
    if (fieldData.regex !== undefined) {
      fields.push(`regex = $${paramCount++}`);
      values.push(fieldData.regex);
    }
    if (fieldData.options !== undefined) {
      fields.push(`options = $${paramCount++}`);
      values.push(JSON.stringify(fieldData.options));
    }
    if (fieldData.defaultValue !== undefined) {
      fields.push(`default_value = $${paramCount++}`);
      values.push(fieldData.defaultValue);
    }
    if (fieldData.helpText !== undefined) {
      fields.push(`help_text = $${paramCount++}`);
      values.push(fieldData.helpText);
    }
    if (fieldData.order !== undefined) {
      fields.push(`field_order = $${paramCount++}`);
      values.push(fieldData.order.toString());
    }

    if (fields.length === 0) {
      throw createError('No fields to update', 400);
    }

    const query = `
      UPDATE aks_fields
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw createError('AKS field not found', 404);
    }

    return this.mapAksField(rows[0]);
  }

  static async deleteAksField(id: string): Promise<void> {
    const { rowCount } = await pool.query(
      'DELETE FROM aks_fields WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw createError('AKS field not found', 404);
    }
  }

  // Validation and Field Value Management
  static async validateAksFields(
    aksCode: string,
    fieldValues: AksFieldValue[]
  ): Promise<AksValidationResult> {
    const errors: AksValidationError[] = [];
    const warnings: any[] = [];

    // Get AKS code with fields
    const aksCodeData = await this.getAksCodeByCode(aksCode);
    
    if (!aksCodeData) {
      errors.push({
        fieldId: '',
        kasCode: '',
        fieldName: '',
        message: `AKS code ${aksCode} not found`
      });
      return { isValid: false, errors, warnings };
    }

    // Create map of provided values
    const valueMap = new Map(
      fieldValues.map(v => [v.kasCode, v])
    );

    // Validate each field
    for (const field of aksCodeData.fields) {
      const providedValue = valueMap.get(field.kasCode);

      // Check required fields
      if (field.isRequired && (!providedValue || !providedValue.value)) {
        errors.push({
          fieldId: field.id,
          kasCode: field.kasCode,
          fieldName: field.fieldName,
          message: `Required field ${field.displayName} is missing`
        });
        continue;
      }

      // Validate provided value
      if (providedValue && providedValue.value) {
        const validationErrors = await this.validateFieldValue(field, providedValue.value);
        
        if (validationErrors.length > 0) {
          errors.push(...validationErrors.map(err => ({
            fieldId: field.id,
            kasCode: field.kasCode,
            fieldName: field.fieldName,
            message: err,
            value: providedValue.value
          })));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static async validateFieldValue(field: AksField, value: any): Promise<string[]> {
    const errors: string[] = [];

    // Type validation
    switch (field.dataType) {
      case AksDataType.INTEGER:
      case AksDataType.DECIMAL: {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push('Must be a valid number');
        } else {
          if (field.minValue !== undefined && numValue < field.minValue) {
            errors.push(`Value must be at least ${field.minValue}`);
          }
          if (field.maxValue !== undefined && numValue > field.maxValue) {
            errors.push(`Value must be at most ${field.maxValue}`);
          }
        }
        break;
      }

      case AksDataType.STRING: {
        const strValue = String(value);
        if (field.minLength && strValue.length < field.minLength) {
          errors.push(`Must be at least ${field.minLength} characters`);
        }
        if (field.maxLength && strValue.length > field.maxLength) {
          errors.push(`Must be at most ${field.maxLength} characters`);
        }
        if (field.regex) {
          const regex = new RegExp(field.regex);
          if (!regex.test(strValue)) {
            errors.push('Does not match required pattern');
          }
        }
        break;
      }

      case AksDataType.DATE: {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push('Must be a valid date');
        }
        break;
      }

      case AksDataType.BOOLEAN:
        if (typeof value !== 'boolean' && !['true', 'false', '1', '0'].includes(String(value))) {
          errors.push('Must be a boolean value');
        }
        break;
    }

    // Options validation for select/radio fields
    if ((field.fieldType === AksFieldType.SELECT || field.fieldType === AksFieldType.RADIO) && field.options) {
      const validOptions = field.options.map((opt: any) => opt.value);
      if (!validOptions.includes(value)) {
        errors.push(`Must be one of: ${validOptions.join(', ')}`);
      }
    }

    return errors;
  }

  static async saveAnlageAksValues(
    anlageId: string,
    aksFieldValues: AksFieldValue[]
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const fieldValue of aksFieldValues) {
        const query = `
          INSERT INTO anlage_aks_values (
            id, anlage_id, aks_field_id, kas_code, value, value_json, is_valid, validation_errors
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (anlage_id, aks_field_id)
          DO UPDATE SET 
            value = EXCLUDED.value,
            value_json = EXCLUDED.value_json,
            is_valid = EXCLUDED.is_valid,
            validation_errors = EXCLUDED.validation_errors,
            updated_at = CURRENT_TIMESTAMP
        `;

        const id = uuidv4();
        const valueJson = typeof fieldValue.value === 'object' 
          ? JSON.stringify(fieldValue.value)
          : null;

        await client.query(query, [
          id,
          anlageId,
          fieldValue.fieldId,
          fieldValue.kasCode,
          String(fieldValue.value),
          valueJson,
          fieldValue.isValid !== false,
          JSON.stringify(fieldValue.validationErrors || [])
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAnlageAksValues(anlageId: string): Promise<AksFieldValue[]> {
    const query = `
      SELECT 
        av.aks_field_id as field_id,
        av.kas_code,
        av.value,
        av.value_json,
        av.is_valid,
        av.validation_errors,
        f.field_name,
        f.display_name,
        f.field_type,
        f.data_type,
        f.unit
      FROM anlage_aks_values av
      JOIN aks_fields f ON av.aks_field_id = f.id
      WHERE av.anlage_id = $1
      ORDER BY f.field_order
    `;

    const { rows } = await pool.query(query, [anlageId]);

    return rows.map(row => ({
      fieldId: row.field_id,
      kasCode: row.kas_code,
      value: row.value_json ? JSON.parse(row.value_json) : row.value,
      isValid: row.is_valid,
      validationErrors: JSON.parse(row.validation_errors || '[]')
    }));
  }

  static async getAksFieldMapping(aksCode: string): Promise<AksFieldMapping> {
    const aksCodeData = await this.getAksCodeByCode(aksCode);
    
    if (!aksCodeData) {
      throw createError(`AKS code ${aksCode} not found`, 404);
    }

    const mapping: AksFieldMapping = {};

    for (const field of aksCodeData.fields) {
      mapping[field.kasCode] = {
        fieldName: field.fieldName,
        displayName: field.displayName,
        fieldType: field.fieldType,
        dataType: field.dataType,
        unit: field.unit,
        isRequired: field.isRequired,
        validation: {
          minValue: field.minValue,
          maxValue: field.maxValue,
          minLength: field.minLength,
          maxLength: field.maxLength,
          regex: field.regex
        }
      };
    }

    return mapping;
  }

  // Helper methods
  private static mapAksCode(row: any): AksCode {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      isActive: row.is_active,
      level: row.level,
      parentCode: row.parent_code,
      isCategory: row.is_category,
      sortOrder: row.sort_order,
      maintenanceIntervalMonths: row.maintenance_interval_months,
      maintenanceType: row.maintenance_type,
      maintenanceDescription: row.maintenance_description,
      fields: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapAksCodeWithFields(row: any): AksCode {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      isActive: row.is_active,
      level: row.level,
      parentCode: row.parent_code,
      isCategory: row.is_category,
      sortOrder: row.sort_order,
      maintenanceIntervalMonths: row.maintenance_interval_months,
      maintenanceType: row.maintenance_type,
      maintenanceDescription: row.maintenance_description,
      fields: row.fields || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapAksField(row: any): AksField {
    return {
      id: row.id,
      aksCodeId: row.aks_code_id,
      kasCode: row.kas_code,
      fieldName: row.field_name,
      displayName: row.display_name,
      fieldType: row.field_type,
      dataType: row.data_type,
      unit: row.unit,
      isRequired: row.is_required,
      minValue: row.min_value,
      maxValue: row.max_value,
      minLength: row.min_length,
      maxLength: row.max_length,
      regex: row.regex,
      options: JSON.parse(row.options || '[]'),
      defaultValue: row.default_value,
      helpText: row.help_text,
      order: row.field_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}