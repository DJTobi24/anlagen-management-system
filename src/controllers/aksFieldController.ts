import { Request, Response, NextFunction } from 'express';
import aksFieldService from '../services/aksFieldService';
import { AuthRequest } from '../types';

class AksFieldController {
  /**
   * Get field definitions for an AKS code
   */
  async getFieldsByAksCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { aksCode } = req.params;
      const fields = await aksFieldService.getFieldsByAksCode(aksCode);
      
      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all field definitions
   */
  async getAllFields(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fields = await aksFieldService.getAllFields();
      
      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update field definition
   */
  async upsertFieldDefinition(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fieldData = req.body;
      
      // Validate required fields
      if (!fieldData.aks_code || !fieldData.field_name || !fieldData.field_label) {
        res.status(400).json({
          success: false,
          error: 'AKS code, field name and field label are required'
        });
        return;
      }
      
      const field = await aksFieldService.upsertFieldDefinition(fieldData);
      
      res.json({
        success: true,
        data: field,
        message: fieldData.id ? 'Field updated successfully' : 'Field created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete field definition
   */
  async deleteFieldDefinition(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await aksFieldService.deleteFieldDefinition(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Field definition not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Field definition deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get field values for an anlage
   */
  async getAnlageFieldValues(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { anlageId } = req.params;
      const values = await aksFieldService.getAnlageFieldValues(anlageId);
      
      res.json({
        success: true,
        data: values
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save field values for an anlage
   */
  async saveAnlageFieldValues(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { anlageId } = req.params;
      const { values } = req.body;
      const userId = req.user?.id!;
      
      if (!Array.isArray(values)) {
        res.status(400).json({
          success: false,
          error: 'Values must be an array'
        });
        return;
      }
      
      await aksFieldService.saveAnlageFieldValues(anlageId, values, userId);
      
      res.json({
        success: true,
        message: 'Field values saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate anlage fields
   */
  async validateAnlageFields(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { anlageId } = req.params;
      const validation = await aksFieldService.validateAnlageFields(anlageId);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get field statistics
   */
  async getFieldStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const mandantId = req.mandantId;
      const statistics = await aksFieldService.getFieldStatistics(mandantId);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Copy field definitions between AKS codes
   */
  async copyFieldDefinitions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sourceAksCode, targetAksCode } = req.body;
      
      if (!sourceAksCode || !targetAksCode) {
        res.status(400).json({
          success: false,
          error: 'Source and target AKS codes are required'
        });
        return;
      }
      
      await aksFieldService.copyFieldDefinitions(sourceAksCode, targetAksCode);
      
      res.json({
        success: true,
        message: 'Field definitions copied successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update field definitions
   */
  async bulkUpdateFields(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fields } = req.body;
      
      if (!Array.isArray(fields)) {
        res.status(400).json({
          success: false,
          error: 'Fields must be an array'
        });
        return;
      }
      
      const results = [];
      for (const field of fields) {
        const updated = await aksFieldService.upsertFieldDefinition(field);
        results.push(updated);
      }
      
      res.json({
        success: true,
        data: results,
        message: `${results.length} field definitions updated`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AksFieldController();