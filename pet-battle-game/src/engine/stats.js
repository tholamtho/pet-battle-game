export function computeStats(base, level) {
  const scale = (b) => Math.floor((b * 2 * level) / 100) + 5;
  return {
    hp: Math.floor((base.hp * 2 * level) / 100) + level + 10,
    atk: scale(base.atk),
    def: scale(base.def),
    spAtk: scale(base.spAtk),
    spDef: scale(base.spDef),
    speed: scale(base.speed),
  };
}
