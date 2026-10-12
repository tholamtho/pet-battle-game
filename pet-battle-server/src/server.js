import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { pool } from './db/pool.js';
import { loadCatalog } from './modules/catalog/catalog.service.js';
import * as battlesRepo from './modules/battle/battles.repo.js';
import { attachRealtime } from './realtime/index.js';

await loadCatalog();
const abandoned = await battlesRepo.abandonStalePvp();
if (abandoned) logger.warn({ abandoned }, 'Marked stale PvP battles as abandoned');

const server = createApp().listen(env.PORT, () => logger.info(`API + WebSocket (/ws) listening on :${env.PORT} (${env.NODE_ENV})`));
const realtime = attachRealtime(server);

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  realtime.close();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled rejection'));
