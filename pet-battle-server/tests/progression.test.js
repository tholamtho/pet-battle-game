import { describe, it, expect } from 'vitest';
import { applyExp, expToNext, playerLevelFromExp, rewardsFor } from '../src/modules/battle/progression.js';

describe('progression', () => {
  it('levels up and carries the remainder', () => {
    const need = expToNext(5);
    expect(applyExp({ level: 5, exp: 0 }, need + 3)).toMatchObject({ level: 6, exp: 3, levelsGained: 1 });
  });
  it('can gain several levels at once', () => {
    expect(applyExp({ level: 1, exp: 0 }, 10_000).levelsGained).toBeGreaterThan(2);
  });
  it('caps at max level', () => {
    expect(applyExp({ level: 99, exp: 0 }, 10 ** 9)).toMatchObject({ level: 100, exp: 0 });
  });
  it('rewards grow with wild level; player level is derived from exp', () => {
    expect(rewardsFor(10).exp).toBeGreaterThan(rewardsFor(2).exp);
    expect(playerLevelFromExp(0)).toBe(1);
    expect(playerLevelFromExp(640)).toBe(5);
  });
});
