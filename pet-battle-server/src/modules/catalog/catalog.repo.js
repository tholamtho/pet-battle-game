import { pool } from '../../db/pool.js';

export async function fetchAll(db = pool) {
  const [skills, species, speciesSkills, typeChart, items] = await Promise.all([
    db.query('SELECT id, name, element, category, power, accuracy, priority, anim FROM skills ORDER BY id'),
    db.query('SELECT * FROM species ORDER BY id'),
    db.query('SELECT species_id, skill_id, learn_level FROM species_skills'),
    db.query('SELECT attacker, defender, multiplier FROM type_chart'),
    db.query('SELECT id, name, description, type, rarity, slot, stats, effect, hatch_seconds, price FROM items ORDER BY id'),
  ]);
  return { skills: skills.rows, species: species.rows, speciesSkills: speciesSkills.rows, typeChart: typeChart.rows, items: items.rows };
}
