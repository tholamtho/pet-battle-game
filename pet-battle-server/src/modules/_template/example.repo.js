import { pool } from '../../db/pool.js';
import { camelizeAll } from '../../common/case.js';

export async function listForOwner(ownerId, db = pool) {
  const { rows } = await db.query('SELECT * FROM example WHERE owner_id = $1', [ownerId]);
  return camelizeAll(rows);
}
