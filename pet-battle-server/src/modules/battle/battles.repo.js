import { pool } from '../../db/pool.js';
import { camelize } from '../../common/case.js';

const COLS = 'id, mode, status, p1_user, p2_user, state, winner, end_reason, created_at';

export async function insert({ mode, p1User, p2User = null, state }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO battles (mode, p1_user, p2_user, state) VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
    [mode, p1User, p2User, JSON.stringify(state)],
  );
  return camelize(rows[0]);
}

export async function findById(id, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(`SELECT ${COLS} FROM battles WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [id]);
  return camelize(rows[0]);
}

export async function findActivePve(userId, db = pool) {
  const { rows } = await db.query(
    `SELECT ${COLS} FROM battles WHERE p1_user = $1 AND mode = 'pve' AND status = 'active'`,
    [userId],
  );
  return camelize(rows[0]);
}

export async function save(id, state, db = pool) {
  await db.query('UPDATE battles SET state = $2 WHERE id = $1', [id, JSON.stringify(state)]);
}

export async function finish(id, { state, winner, reason, status = 'finished' }, db = pool) {
  await db.query(
    `UPDATE battles SET state = $2, winner = $3, end_reason = $4, status = $5, finished_at = now() WHERE id = $1`,
    [id, JSON.stringify(state), winner, reason, status],
  );
}

/** On boot: PvP rooms live in memory, so any 'active' PvP row belongs to a dead process. */
export async function abandonStalePvp(db = pool) {
  const { rowCount } = await db.query(
    `UPDATE battles SET status = 'abandoned', end_reason = 'server_restart', finished_at = now()
      WHERE mode = 'pvp' AND status = 'active'`,
  );
  return rowCount;
}
