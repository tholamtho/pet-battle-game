import { other } from './sides.js';
import { typeMultiplier } from './damage.js';

/** Wild/NPC opponent: 60% best expected damage, otherwise random. */
export function chooseAiSkill(state, side, catalog, rng) {
  const me = state.sides[side];
  const foe = state.sides[other(side)];
  if (rng() < 0.6) {
    const score = (id) => {
      const s = catalog.skills.get(id);
      return s.power * typeMultiplier(s.element, foe.elements, catalog.typeChart) * (s.accuracy / 100);
    };
    return [...me.skills].sort((a, b) => score(b) - score(a))[0];
  }
  return me.skills[Math.floor(rng() * me.skills.length)];
}
