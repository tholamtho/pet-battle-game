import { pool } from '../../db/pool.js';
import { camelizeAll } from '../../common/case.js';

export async function list(userId, db = pool) {
  const { rows } = await db.query('SELECT item_id, quantity FROM inventory WHERE user_id = $1 AND quantity > 0 ORDER BY item_id', [userId]);
  return camelizeAll(rows);
}

export async function add(userId, itemId, quantity, db = pool) {
  await db.query(
    `INSERT INTO inventory (user_id, item_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity`,
    [userId, itemId, quantity],
  );
}

/** Removes `quantity` if the player has that many. Returns false (and changes nothing) otherwise. */
export async function remove(userId, itemId, quantity, db = pool) {
  const { rowCount } = await db.query(
    'UPDATE inventory SET quantity = quantity - $3 WHERE user_id = $1 AND item_id = $2 AND quantity >= $3',
    [userId, itemId, quantity],
  );
  if (rowCount) await db.query('DELETE FROM inventory WHERE user_id = $1 AND item_id = $2 AND quantity = 0', [userId, itemId]);
  return rowCount === 1;
}
