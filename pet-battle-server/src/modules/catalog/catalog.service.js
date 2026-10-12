import { pool } from '../../db/pool.js';
import * as repo from './catalog.repo.js';

let current = null;

/** Loads static game data into memory once (the battle engine needs it synchronously). Restart or reload after seeding. */
export async function loadCatalog(db = pool) {
  const raw = await repo.fetchAll(db);

  const skills = new Map(raw.skills.map((s) => [s.id, s]));
  const species = new Map(
    raw.species.map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        elements: r.elements,
        baseStats: { hp: r.base_hp, atk: r.base_atk, def: r.base_def, spAtk: r.base_sp_atk, spDef: r.base_sp_def, speed: r.base_speed },
        isStarter: r.is_starter,
        evolution: r.evolves_to ? { to: r.evolves_to, level: r.evolve_level, itemId: r.evolve_item } : null,
        skills: [],
      },
    ]),
  );
  for (const row of raw.speciesSkills) {
    species.get(row.species_id)?.skills.push({ skillId: row.skill_id, learnLevel: row.learn_level });
  }
  const typeChart = {};
  for (const { attacker, defender, multiplier } of raw.typeChart) (typeChart[attacker] ??= {})[defender] = multiplier;

  const items = new Map(
    raw.items.map((i) => [i.id, { id: i.id, name: i.name, description: i.description, type: i.type, rarity: i.rarity, slot: i.slot, stats: i.stats, effect: i.effect, hatchSeconds: i.hatch_seconds, price: i.price }]),
  );

  current = { species, skills, typeChart, items };
  return current;
}

export function getCatalog() {
  if (!current) throw new Error('Catalog not loaded: call loadCatalog() at startup');
  return current;
}

/** Test helper. */
export const setCatalog = (catalog) => {
  current = catalog;
};

export function catalogToJson(catalog = getCatalog()) {
  return { species: [...catalog.species.values()], skills: [...catalog.skills.values()], typeChart: catalog.typeChart, items: [...catalog.items.values()] };
}
