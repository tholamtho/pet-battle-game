/** Picks one entry by `weight`. Pass a custom rng in tests. */
export function pickWeighted(entries, rng = Math.random) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    if (roll < e.weight) return e;
    roll -= e.weight;
  }
  return entries[entries.length - 1];
}
