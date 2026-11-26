import { Request, Response } from 'express';
import { store } from '../database/store';

export const getHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'MediCore Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

export const getReadiness = (req: Request, res: Response) => {
  const isReady = store.users.length > 0;
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
      entities: {
        users: store.users.length,
        patients: store.patients.length,
        doctors: store.doctors.length,
        appointments: store.appointments.length
      }
    },
    timestamp: new Date().toISOString()
  });
};
