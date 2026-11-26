import { Router } from 'express';
import { login, registerPatient, refreshTokens, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

// Rate limit login & register endpoints to 20 attempts per minute
router.post('/login', rateLimiter(20, 60000), login);
router.post('/register', rateLimiter(15, 60000), registerPatient);
router.post('/refresh', rateLimiter(60,60000), refreshTokens);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
