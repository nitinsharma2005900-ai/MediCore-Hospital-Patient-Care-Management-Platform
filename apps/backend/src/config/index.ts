import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4001', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'medicore_jwt_access_secret_sample_key_minimum_32_characters_for_security',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'medicore_jwt_refresh_secret_sample_key_minimum_32_characters_for_security',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://medicore_user:medicore_secure_password_2026@localhost:5432/medicore_db?schema=public',
    mode: process.env.DATABASE_MODE || 'local'
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
    token: process.env.FHIR_AUTH_TOKEN || 'medicore-fhir-dev-token'
  },
  notifications: {
    smsProvider: process.env.SMS_PROVIDER || 'sandbox',
    emailFrom: process.env.EMAIL_FROM || 'noreply@medicore.health'
  }
};
