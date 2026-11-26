import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const candidate = req.headers['x-request-id'];
  const correlationId = typeof candidate === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(candidate) ? candidate : uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-request-id', correlationId);
  next();
};
