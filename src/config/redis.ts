import { createClient } from 'redis';
import dotenv from 'dotenv';
import mockRedis from './redis-mock';

dotenv.config();

const useMock = !process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost') || process.env.REDIS_URL.includes('mock');

const redisClient = useMock ? mockRedis : createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

if (!useMock) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });
} else {
  console.log('⚠️  Using mock Redis - real Redis not available');
}

export default redisClient;