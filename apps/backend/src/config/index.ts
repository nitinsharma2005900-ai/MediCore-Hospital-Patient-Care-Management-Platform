import dotenv from 'dotenv';
import path from 'path';
import { randomBytes } from 'crypto';

// Load .env from project root if present
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32 ||
    process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET || !process.env.DATABASE_URL)) {
  throw new Error('Production requires DATABASE_URL and distinct JWT secrets of at least 32 characters');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4001', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || randomBytes(48).toString('hex'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || randomBytes(48).toString('hex'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  database: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    mode: process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL ? 'memory' : 'postgres'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || ''
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',')
  },
  fhir: {
    baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:4000/api/v1/fhir',
    token: process.env.FHIR_AUTH_TOKEN || ''
  },
  notifications: {
    smsProvider: process.env.SMS_PROVIDER || 'sandbox',
    emailFrom: process.env.EMAIL_FROM || 'noreply@medicore.health'
  }
};
