import { pool } from '../../db/pool.js';
import { camelizeAll } from '../../common/case.js';

const toSpecies = (r) => ({
  id: r.id,
  name: r.name,
  elements: r.elements,
  baseStats: { hp: r.base_hp, atk: r.base_atk, def: r.base_def, spAtk: r.base_sp_atk, spDef: r.base_sp_def, speed: r.base_speed },
  isStarter: r.is_starter,
});

export async function list(db = pool) {
  const { rows } = await db.query('SELECT * FROM species ORDER BY name');
  return rows.map(toSpecies);
}

export async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM species WHERE id = $1', [id]);
  return rows[0] ? toSpecies(rows[0]) : null;
}

export async function skillsFor(speciesId, maxLevel = 100, db = pool) {
  const { rows } = await db.query(
    `SELECT k.id, k.name, k.element, k.category, k.power, k.accuracy, k.priority, ss.learn_level
       FROM species_skills ss JOIN skills k ON k.id = ss.skill_id
      WHERE ss.species_id = $1 AND ss.learn_level <= $2
      ORDER BY ss.learn_level, k.name`,
    [speciesId, maxLevel],
  );
  return camelizeAll(rows);
}
