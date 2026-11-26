import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@medicore/shared';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.correlationId || 'unknown';
  const timestamp = new Date().toISOString();

  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters provided',
        details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
      },
      meta: {
        requestId: correlationId,
        timestamp
      }
    };
    res.status(400).json(response);
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      meta: {
        requestId: correlationId,
        timestamp
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Default server error - safe, no internal stack traces leaked
  console.error(JSON.stringify({ event: 'request_error', requestId: correlationId, type: err?.name || 'Error' }));

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact hospital support.',
      details: undefined
    },
    meta: {
      requestId: correlationId,
      timestamp
    }
  };
  res.status(500).json(response);
};
