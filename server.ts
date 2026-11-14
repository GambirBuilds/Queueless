import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/apiRouter.js';
import {
  corsAllowlistMiddleware,
  securityHeadersMiddleware,
  createRateLimiter,
  structuredLoggerMiddleware
} from './src/server/securityMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  // Security headers, CORS allowlist & structured API logging
  app.use(securityHeadersMiddleware);
  app.use(corsAllowlistMiddleware);
  app.use(structuredLoggerMiddleware);

  // Request size limits (prevents payload exhaustion / DoS)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // General API rate limiter (120 req/min per client IP)
  const apiRateLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 120,
    keyPrefix: 'api-global'
  });
  app.use('/api', apiRateLimiter);

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Handle unknown API routes safely
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found.'
    });
  });

  // Vite development middleware or production static serving
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  // Safe centralized error handler (never leaks internal stack traces in production)
  app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'Request payload exceeds maximum allowed size (100KB).'
      });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        success: false,
        error: 'Malformed JSON request body.'
      });
    }

    console.error('[Server Unhandled Error]', isProd ? err.message : err);
    res.status(err.status || 500).json({
      success: false,
      error: isProd ? 'An unexpected internal error occurred.' : (err.message || 'Internal Server Error')
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(JSON.stringify({
      level: 'info',
      event: 'SERVER_STARTED',
      host: '0.0.0.0',
      port: PORT,
      localUrl: `http://localhost:${PORT}`,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }));
    if (!isProd) {
      console.log(`\n  QUEUELESS Development Server ready at http://localhost:${PORT} (bound to 0.0.0.0:${PORT})\n`);
    }
  });
}

startServer().catch((err) => {
  console.error('[QUEUELESS Server Error] Failed to start:', err);
  process.exit(1);
});
