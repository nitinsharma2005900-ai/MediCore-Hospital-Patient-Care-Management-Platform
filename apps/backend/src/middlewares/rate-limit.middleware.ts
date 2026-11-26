import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RateLimitBucket>();

/**
 * In-memory sliding window rate limiter
 * Protects hospital endpoints against brute force and denial-of-service.
 */
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const bucket = ipBuckets.get(clientIp);
    if (!bucket || now > bucket.resetTime) {
      ipBuckets.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(
        new AppError(
          `Too many requests from this address. Please retry in ${retryAfter} seconds.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    next();
  };
};
