import { EVENT, P1, P2, SIDES, other, BattleRuleError } from './sides.js';
import { calcDamage } from './damage.js';
import { computeStats } from './stats.js';
import { createRng } from './rng.js';

const MAX_SKILLS = 4;

/**
 * catalog = { species: Map, skills: Map, typeChart }   (loaded from DB on the server, JSON in the client)
 * species = { id, name, elements, baseStats, skills: [{ skillId, learnLevel }] }
 */
const STAT_KEYS = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed'];

/** equipment = [{ slot, itemId }]. Bonuses are flat and come from catalog.items[itemId].stats. */
export function makeCombatant({ speciesId, level, name, equipment = [], meta = {} }, catalog) {
  const species = catalog.species.get(speciesId);
  if (!species) throw new BattleRuleError('UNKNOWN_SPECIES', `Unknown species ${speciesId}`);
  const stats = computeStats(species.baseStats, level);
  for (const { itemId } of equipment) {
    const bonus = catalog.items?.get(itemId)?.stats ?? {};
    for (const key of STAT_KEYS) stats[key] += bonus[key] ?? 0;
  }
  const skills = species.skills
    .filter((s) => s.learnLevel <= level)
    .sort((a, b) => b.learnLevel - a.learnLevel || a.skillId.localeCompare(b.skillId))
    .slice(0, MAX_SKILLS)
    .map((s) => s.skillId);
  return { speciesId, name: name || species.name, level, elements: species.elements, stats, hp: stats.hp, maxHp: stats.hp, skills, equipment, ...meta };
}

/** What clients may see: no seed, no user ids. */
export function publicState(state) {
  const strip = ({ userId, petId, ...rest }) => rest; // eslint-disable-line no-unused-vars
  return {
    mode: state.mode,
    turn: state.turn,
    status: state.status,
    winner: state.winner,
    sides: { [P1]: strip(state.sides[P1]), [P2]: strip(state.sides[P2]) },
  };
}

export class Battle {
  constructor(state, catalog) {
    this.state = state;
    this.catalog = catalog;
  }

  static create({ mode, p1, p2, seed = Math.floor(Math.random() * 2 ** 31) }, catalog) {
    return new Battle({ mode, seed, turn: 1, status: 'active', winner: null, sides: { [P1]: p1, [P2]: p2 } }, catalog);
  }

  get isOver() {
    return this.state.status !== 'active';
  }

  #order(actions, rng) {
    const prio = (s) => this.catalog.skills.get(actions[s]).priority;
    const speed = (s) => this.state.sides[s].stats.speed;
    return [...SIDES].sort((a, b) => prio(b) - prio(a) || speed(b) - speed(a) || (rng() < 0.5 ? -1 : 1));
  }

  /** actions = { p1: skillId, p2: skillId }. Returns the ordered list of events that happened. */
  resolveTurn(actions) {
    const st = this.state;
    if (this.isOver) throw new BattleRuleError('BATTLE_OVER', 'Battle is already over');
    for (const side of SIDES) {
      if (!st.sides[side].skills.includes(actions[side])) {
        throw new BattleRuleError('INVALID_SKILL', `${side} cannot use "${actions[side]}"`);
      }
    }

    const rng = createRng((st.seed + st.turn * 7919) >>> 0);
    const events = [];
    for (const side of this.#order(actions, rng)) {
      const actor = st.sides[side];
      const target = st.sides[other(side)];
      if (actor.hp <= 0) continue;

      const skill = this.catalog.skills.get(actions[side]);
      const base = { side, targetSide: other(side), actorName: actor.name, skillId: skill.id, skillName: skill.name };

      if (rng() * 100 >= skill.accuracy) {
        events.push({ ...base, type: EVENT.MISS });
        continue;
      }

      const { damage, crit, typeMul } = calcDamage(actor, target, skill, rng, this.catalog.typeChart);
      target.hp = Math.max(0, target.hp - damage);
      events.push({ ...base, type: EVENT.ATTACK, damage, crit, typeMul, targetHp: target.hp, targetMaxHp: target.maxHp });

      if (target.hp === 0) {
        st.status = 'finished';
        st.winner = side;
        events.push({ type: EVENT.FAINT, side: other(side), name: target.name });
        events.push({ type: EVENT.END, winner: side, reason: 'ko' });
        break;
      }
    }
    st.turn += 1;
    return events;
  }

  /** `side` gives up (or disconnected). The other side wins. */
  forfeit(side, reason = 'forfeit') {
    this.state.status = 'finished';
    this.state.winner = other(side);
    return [{ type: EVENT.END, winner: this.state.winner, reason }];
  }
}
