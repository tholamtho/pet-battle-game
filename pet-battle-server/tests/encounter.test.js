import { describe, it, expect } from 'vitest';
import { rollEncounter } from '../src/modules/maps/encounter.js';

const table = [
  { speciesId: 'a', weight: 70, minLevel: 5, maxLevel: 9 },
  { speciesId: 'b', weight: 30, minLevel: 2, maxLevel: 2 },
];

describe('rollEncounter', () => {
  it('picks by weight boundaries', () => {
    expect(rollEncounter(table, () => 0).speciesId).toBe('a');
    expect(rollEncounter(table, () => 0.69).speciesId).toBe('a');
    expect(rollEncounter(table, () => 0.71).speciesId).toBe('b');
  });

  it('keeps level inside [min, max]', () => {
    for (let i = 0; i < 200; i++) {
      const { speciesId, level } = rollEncounter(table);
      if (speciesId === 'a') expect(level).toBeGreaterThanOrEqual(5), expect(level).toBeLessThanOrEqual(9);
      else expect(level).toBe(2);
    }
  });
});
