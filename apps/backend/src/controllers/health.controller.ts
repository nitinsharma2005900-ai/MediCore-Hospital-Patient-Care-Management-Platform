import { Request, Response } from 'express';
import { store } from '../database/store';
import { pool } from '../database/postgres';
import { config } from '../config';

export const getHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'MediCore Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

export const getReadiness = async (req: Request, res: Response) => {
  let isReady = config.database.mode === 'memory';
  try { if (!isReady) { await pool.query('SELECT 1'); isReady = true; } } catch { isReady = false; }
  if (!isReady) {
    res.status(503).json({
      status: 'not_ready',
      message: 'Database storage not yet initialized'
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    service: 'MediCore Backend API',
    checks: {
      database: 'connected',
      mode: config.database.mode
    },
    timestamp: new Date().toISOString()
  });
};
