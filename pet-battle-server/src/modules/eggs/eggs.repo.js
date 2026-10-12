import { pool } from '../../db/pool.js';
import { camelize, camelizeAll } from '../../common/case.js';

// remaining_seconds is computed by the DB clock so client clocks never matter.
const COLS = `id, item_id, started_at,
  GREATEST(0, CEIL(EXTRACT(EPOCH FROM (hatch_at - now()))))::int AS remaining_seconds`;

export async function list(ownerId, db = pool) {
  const { rows } = await db.query(`SELECT ${COLS} FROM eggs WHERE owner_id = $1 ORDER BY hatch_at`, [ownerId]);
  return camelizeAll(rows);
}

export async function findOwned(id, ownerId, db = pool, { forUpdate = false } = {}) {
  const { rows } = await db.query(`SELECT ${COLS} FROM eggs WHERE id = $1 AND owner_id = $2${forUpdate ? ' FOR UPDATE' : ''}`, [id, ownerId]);
  return camelize(rows[0]);
}

export async function count(ownerId, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM eggs WHERE owner_id = $1', [ownerId]);
  return rows[0].n;
}

export async function insert({ ownerId, itemId, seconds }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO eggs (owner_id, item_id, hatch_at) VALUES ($1, $2, now() + make_interval(secs => $3)) RETURNING id`,
    [ownerId, itemId, seconds],
  );
  return findOwned(rows[0].id, ownerId, db);
}

export async function shorten(id, seconds, db = pool) {
  await db.query('UPDATE eggs SET hatch_at = hatch_at - make_interval(secs => $2) WHERE id = $1', [id, seconds]);
}

export async function remove(id, db = pool) {
  await db.query('DELETE FROM eggs WHERE id = $1', [id]);
}

export async function poolFor(itemId, db = pool) {
  const { rows } = await db.query('SELECT species_id, weight FROM egg_pools WHERE item_id = $1', [itemId]);
  return camelizeAll(rows);
}
