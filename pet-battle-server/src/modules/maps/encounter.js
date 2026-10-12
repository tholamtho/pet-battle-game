/**
 * Weighted random wild encounter. Pure function: pass a custom rng in tests.
 * encounters: [{ speciesId, weight, minLevel, maxLevel }]
 */
export function rollEncounter(encounters, rng = Math.random) {
  const total = encounters.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  let picked = encounters[encounters.length - 1];
  for (const e of encounters) {
    if (roll < e.weight) {
      picked = e;
      break;
    }
    roll -= e.weight;
  }
  const level = picked.minLevel + Math.floor(rng() * (picked.maxLevel - picked.minLevel + 1));
  return { speciesId: picked.speciesId, level };
}
