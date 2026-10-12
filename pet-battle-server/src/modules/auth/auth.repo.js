import { pool } from '../../db/pool.js';
import { camelize } from '../../common/case.js';

export async function create({ username, passwordHash }, db = pool) {
  const { rows } = await db.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
    [username, passwordHash],
  );
  return camelize(rows[0]);
}

export async function findByUsername(username, db = pool) {
  const { rows } = await db.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
  return camelize(rows[0]);
}
