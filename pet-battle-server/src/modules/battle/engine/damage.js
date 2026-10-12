export function typeMultiplier(attackElement, defenderElements, typeChart) {
  const row = typeChart[attackElement] ?? {};
  return defenderElements.reduce((mul, el) => mul * (row[el] ?? 1), 1);
}

export function calcDamage(attacker, defender, skill, rng, typeChart) {
  const magic = skill.category === 'magic';
  const atk = magic ? attacker.stats.spAtk : attacker.stats.atk;
  const def = magic ? defender.stats.spDef : defender.stats.def;
  const stab = attacker.elements.includes(skill.element) ? 1.25 : 1;
  const typeMul = typeMultiplier(skill.element, defender.elements, typeChart);
  const crit = rng() < 0.0625;
  const variance = 0.9 + rng() * 0.1;
  const base = (atk * skill.power) / (def + 50);
  return { damage: Math.max(1, Math.round(base * stab * typeMul * (crit ? 1.5 : 1) * variance)), crit, typeMul };
}
