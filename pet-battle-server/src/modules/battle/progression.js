export const MAX_PET_LEVEL = 100;

/** Exp needed to go from `level` to `level + 1`. */
export const expToNext = (level) => 20 + level * level * 2;

export function applyExp({ level, exp }, gain, maxLevel = MAX_PET_LEVEL) {
  let l = level;
  let e = exp + gain;
  while (l < maxLevel && e >= expToNext(l)) {
    e -= expToNext(l);
    l += 1;
  }
  if (l >= maxLevel) e = 0;
  return { level: l, exp: e, levelsGained: l - level };
}

export const rewardsFor = (wildLevel) => ({ exp: 15 + wildLevel * 6, gold: 5 + wildLevel * 2 });

/** Player level is derived from total exp, so it can be rebalanced without migrating data. */
export const playerLevelFromExp = (totalExp) => 1 + Math.floor(Math.sqrt(totalExp / 40));
