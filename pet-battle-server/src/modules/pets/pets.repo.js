import { pool } from '../../db/pool.js';
import { camelize, camelizeAll } from '../../common/case.js';

const SELECT = `
  SELECT p.id, p.species_id, s.name AS species_name, s.elements,
         p.nickname, p.level, p.exp, p.team_slot, p.created_at,
         COALESCE((SELECT json_agg(json_build_object('slot', e.slot, 'itemId', e.item_id) ORDER BY e.slot)
                     FROM pet_equipment e WHERE e.pet_id = p.id), '[]'::json) AS equipment
    FROM pets p JOIN species s ON s.id = p.species_id`;

export async function listByOwner(ownerId, db = pool) {
  const { rows } = await db.query(`${SELECT} WHERE p.owner_id = $1 ORDER BY p.team_slot NULLS LAST, p.created_at`, [ownerId]);
  return camelizeAll(rows);
}

export async function findOwned(id, ownerId, db = pool, { forUpdate = false } = {}) {
  const lock = forUpdate ? ' FOR UPDATE OF p' : '';
  const { rows } = await db.query(`${SELECT} WHERE p.id = $1 AND p.owner_id = $2${lock}`, [id, ownerId]);
  return camelize(rows[0]);
}

export async function countByOwner(ownerId, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM pets WHERE owner_id = $1', [ownerId]);
  return rows[0].n;
}

export async function countOwnedAmong(ownerId, ids, db = pool) {
  const { rows } = await db.query('SELECT count(*)::int AS n FROM pets WHERE owner_id = $1 AND id = ANY($2::uuid[])', [ownerId, ids]);
  return rows[0].n;
}

export async function nextFreeTeamSlot(ownerId, db = pool) {
  const { rows } = await db.query(
    `SELECT g AS slot FROM generate_series(1, 6) g
      WHERE NOT EXISTS (SELECT 1 FROM pets WHERE owner_id = $1 AND team_slot = g)
      ORDER BY g LIMIT 1`,
    [ownerId],
  );
  return rows[0]?.slot ?? null;
}

export async function insert({ ownerId, speciesId, level, nickname, teamSlot }, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO pets (owner_id, species_id, level, nickname, team_slot)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [ownerId, speciesId, level, nickname, teamSlot],
  );
  return findOwned(rows[0].id, ownerId, db);
}

export async function updateNickname(id, ownerId, nickname, db = pool) {
  await db.query('UPDATE pets SET nickname = $3 WHERE id = $1 AND owner_id = $2', [id, ownerId, nickname]);
}

export async function remove(id, ownerId, db = pool) {
  await db.query('DELETE FROM pets WHERE id = $1 AND owner_id = $2', [id, ownerId]);
}

/** Replaces the whole team: clears every slot, then assigns slot 1..n in the given order. */
export async function replaceTeam(ownerId, petIds, db = pool) {
  await db.query('UPDATE pets SET team_slot = NULL WHERE owner_id = $1 AND team_slot IS NOT NULL', [ownerId]);
  if (!petIds.length) return;
  await db.query(
    `UPDATE pets SET team_slot = t.slot
       FROM unnest($2::uuid[], $3::int[]) AS t(id, slot)
      WHERE pets.id = t.id AND pets.owner_id = $1`,
    [ownerId, petIds, petIds.map((_, i) => i + 1)],
  );
}

/** The pet in team slot 1 (the default fighter). Falls back to the oldest pet. */
export async function findTeamLead(ownerId, db = pool) {
  const { rows } = await db.query(
    `${SELECT} WHERE p.owner_id = $1 ORDER BY p.team_slot NULLS LAST, p.created_at LIMIT 1`,
    [ownerId],
  );
  return camelize(rows[0]);
}

export async function setProgress(id, ownerId, { level, exp }, db = pool) {
  await db.query('UPDATE pets SET level = $3, exp = $4 WHERE id = $1 AND owner_id = $2', [id, ownerId, level, exp]);
}

export async function setSpecies(id, ownerId, speciesId, db = pool) {
  await db.query('UPDATE pets SET species_id = $3 WHERE id = $1 AND owner_id = $2', [id, ownerId, speciesId]);
}
