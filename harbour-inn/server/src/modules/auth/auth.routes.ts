import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Passwordless OTP lifecycle
router.post('/otp/request', (req, res, next) => authController.requestOtp(req, res, next));
router.post('/otp/verify', (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/otp/resend', (req, res, next) => authController.resendOtp(req, res, next));

// Session maintenance
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', optionalAuth, (req, res, next) => authController.logout(req, res, next));
router.post('/logout-all', requireAuth, (req, res, next) => authController.logoutAll(req, res, next));

export default router;
