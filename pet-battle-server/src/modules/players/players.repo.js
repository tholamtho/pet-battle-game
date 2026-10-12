import { pool } from '../../db/pool.js';
import { camelize } from '../../common/case.js';

export async function create(userId, db = pool) {
  await db.query('INSERT INTO players (user_id) VALUES ($1)', [userId]);
}

export async function findByUserId(userId, db = pool) {
  const { rows } = await db.query(
    `SELECT p.user_id, u.username, p.level, p.exp, p.gold, p.current_map_id, p.incubator_slots, p.created_at
       FROM players p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1`,
    [userId],
  );
  return camelize(rows[0]);
}

/** Serialises concurrent requests for the same player (e.g. double-clicking "choose starter"). */
export async function lock(userId, db) {
  await db.query('SELECT 1 FROM players WHERE user_id = $1 FOR UPDATE', [userId]);
}

export async function setCurrentMap(userId, mapId, db = pool) {
  await db.query('UPDATE players SET current_map_id = $2 WHERE user_id = $1', [userId, mapId]);
}

export async function setProgress(userId, { level, exp, gold }, db = pool) {
  await db.query('UPDATE players SET level = $2, exp = $3, gold = $4 WHERE user_id = $1', [userId, level, exp, gold]);
}

/** Atomically spends gold. Returns false if the player can't afford it. */
export async function spendGold(userId, amount, db = pool) {
  const { rowCount } = await db.query('UPDATE players SET gold = gold - $2 WHERE user_id = $1 AND gold >= $2', [userId, amount]);
  return rowCount === 1;
}
