import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (err) => logger.error({ err }, 'Unexpected idle pg client error'));

/** Runs fn inside a transaction. fn receives a client; pass it to repos as their `db` argument. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
