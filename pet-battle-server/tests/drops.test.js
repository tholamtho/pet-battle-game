import { describe, it, expect } from 'vitest';
import { rollDrops } from '../src/modules/battle/drops.js';
import { pickWeighted } from '../src/common/random.js';

const drops = [
  { itemId: 'candy', chance: 0.3, minQty: 1, maxQty: 2 },
  { itemId: 'egg', chance: 0.05, minQty: 1, maxQty: 1 },
];

describe('rollDrops', () => {
  it('drops only entries whose roll is under the chance', () => {
    const seq = [0.1, 0.9]; // candy yes (+qty roll), egg no
    let i = 0;
    const rng = () => (i < seq.length ? seq[i++] : 0.99);
    expect(rollDrops(drops, rng)).toEqual([{ itemId: 'candy', quantity: 2 }]);
  });
  it('can drop nothing, and quantity stays within [min, max]', () => {
    expect(rollDrops(drops, () => 0.99)).toEqual([]);
    for (let i = 0; i < 300; i++) for (const d of rollDrops(drops)) expect(d.quantity).toBeGreaterThanOrEqual(1) && expect(d.quantity).toBeLessThanOrEqual(2);
  });
});

describe('pickWeighted', () => {
  const pool = [{ speciesId: 'a', weight: 70 }, { speciesId: 'b', weight: 30 }];
  it('respects weight boundaries', () => {
    expect(pickWeighted(pool, () => 0).speciesId).toBe('a');
    expect(pickWeighted(pool, () => 0.69).speciesId).toBe('a');
    expect(pickWeighted(pool, () => 0.71).speciesId).toBe('b');
  });
});
