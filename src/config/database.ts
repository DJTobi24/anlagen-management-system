import { Pool } from 'pg';
import dotenv from 'dotenv';
import mockPool from './database-mock';

dotenv.config();

const useMock = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('mock');

const pool = useMock ? mockPool : new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

if (useMock) {
  console.log('⚠️  Using mock database - real PostgreSQL not available');
}

export default pool;