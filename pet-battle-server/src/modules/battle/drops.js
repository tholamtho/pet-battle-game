/** drops: [{ itemId, chance (0-1], minQty, maxQty }] -> [{ itemId, quantity }] */
export function rollDrops(drops, rng = Math.random) {
  const out = [];
  for (const d of drops) {
    if (rng() >= d.chance) continue;
    out.push({ itemId: d.itemId, quantity: d.minQty + Math.floor(rng() * (d.maxQty - d.minQty + 1)) });
  }
  return out;
}
