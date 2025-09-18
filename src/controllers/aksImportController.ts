import { Response, NextFunction } from 'express';
import multer from 'multer';
import { AuthRequest } from '../types';
import aksImportService from '../services/aksImportService';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
}).single('file');

class AksImportController {
  uploadMiddleware = upload;

  /**
   * Import AKS codes with field definitions
   */
  async importAksWithFields(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const result = await aksImportService.importAksWithFields(
        req.file.buffer,
        req.mandantId!,
        req.user?.id!
      );

      res.json({
        success: true,
        message: `Import abgeschlossen: ${result.success} AKS-Codes und ${result.importedFields} Felder importiert`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download AKS import template
   */
  async downloadTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await aksImportService.generateAksImportTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=AKS_Import_Template.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new AksImportController();