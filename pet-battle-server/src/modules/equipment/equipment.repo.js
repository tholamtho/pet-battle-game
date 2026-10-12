import { pool } from '../../db/pool.js';

export async function get(petId, slot, db = pool) {
  const { rows } = await db.query('SELECT item_id FROM pet_equipment WHERE pet_id = $1 AND slot = $2', [petId, slot]);
  return rows[0]?.item_id ?? null;
}

export async function set(petId, slot, itemId, db = pool) {
  await db.query(
    `INSERT INTO pet_equipment (pet_id, slot, item_id) VALUES ($1, $2, $3)
     ON CONFLICT (pet_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id`,
    [petId, slot, itemId],
  );
}

export async function clear(petId, slot, db = pool) {
  await db.query('DELETE FROM pet_equipment WHERE pet_id = $1 AND slot = $2', [petId, slot]);
}
