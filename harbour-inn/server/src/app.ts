import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import { csrfProtection } from './middleware/csrf.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { healthCheck } from './db';

export const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.frontendUrl],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Strict CORS Configuration
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    exposedHeaders: ['Retry-After'],
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// 4. CSRF Protection for state-changing requests
app.use(csrfProtection);

// 5. Health Check Endpoint
app.get('/api/v1/health', async (req: Request, res: Response) => {
  const dbOk = await healthCheck();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'Harbour Inn Auth API',
    version: '1.0.0',
    db: dbOk ? 'connected' : 'unreachable',
    timestamp: new Date(),
  });
});

// 6. API Version 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes);

// 7. Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
