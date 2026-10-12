import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { pool } from './db/pool.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { buildApiRouter } from './modules/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render/Fly/Railway proxies, so rate limiting sees the real IP

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url.startsWith('/health') } }));
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'db_unavailable' });
    }
  });

  app.use('/api/v1', apiLimiter, buildApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
