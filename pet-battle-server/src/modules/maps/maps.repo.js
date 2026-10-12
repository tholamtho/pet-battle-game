import { pool } from '../../db/pool.js';
import { camelize, camelizeAll } from '../../common/case.js';

export async function list(db = pool) {
  const { rows } = await db.query('SELECT id, name, description, min_level FROM maps ORDER BY sort_order, id');
  return camelizeAll(rows);
}

export async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT id, name, description, min_level FROM maps WHERE id = $1', [id]);
  return camelize(rows[0]);
}

export async function listEncounters(mapId, db = pool) {
  const { rows } = await db.query(
    `SELECT e.species_id, s.name AS species_name, e.weight, e.min_level, e.max_level
       FROM map_encounters e JOIN species s ON s.id = e.species_id WHERE e.map_id = $1 ORDER BY e.weight DESC`,
    [mapId],
  );
  return camelizeAll(rows);
}

export async function listDrops(mapId, db = pool) {
  const { rows } = await db.query('SELECT item_id, chance, min_qty, max_qty FROM map_drops WHERE map_id = $1', [mapId]);
  return camelizeAll(rows);
}
