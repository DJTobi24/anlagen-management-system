import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from '@/config/database';
import redisClient from '@/config/redis';
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import mandantRoutes from '@/routes/mandanten';
import liegenschaftRoutes from '@/routes/liegenschaften';
import objektRoutes from '@/routes/objekte';
import anlageRoutes from '@/routes/anlagen';
import importRoutes from '@/routes/import';
import aksRoutes from '@/routes/aks';
import fmDataRoutes from '@/routes/fmData';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { ImportService } from '@/services/importService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy for rate limiting when behind nginx
app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/users`, userRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/mandanten`, mandantRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/liegenschaften`, liegenschaftRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/objekte`, objektRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/anlagen`, anlageRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/import`, importRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/aks`, aksRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/fm-data`, fmDataRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await redisClient.connect();
    
    await pool.query('SELECT 1');
    console.log('Database connected successfully');
    
    // Initialize upload directory for import files
    await ImportService.initializeUploadDirectory();
    console.log('Import upload directory initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}${API_PREFIX}/${API_VERSION}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Shutdown import queue service
  try {
    const { importQueueService } = await import('@/services/importQueue');
    await importQueueService.shutdown();
  } catch (error) {
    console.warn('Failed to shutdown import queue service:', error.message);
  }
  
  await redisClient.quit();
  await pool.end();
  process.exit(0);
});

startServer();