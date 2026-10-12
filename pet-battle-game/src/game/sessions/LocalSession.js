import { getCatalog, listSpecies } from '@/data/index.js';
import { Battle, chooseAiSkill, createRng, makeCombatant, publicState } from '@/engine/index.js';

/**
 * Offline practice. Same interface as the online sessions:
 *   you, state, submitSkill(id) -> { events, state, rewards }, forfeit(), close()
 */
export class LocalSession {
  constructor() {
    const catalog = getCatalog();
    const ids = listSpecies().map((s) => s.id).sort(() => Math.random() - 0.5);
    this.you = 'p1';
    this.rng = createRng();
    this.battle = Battle.create(
      {
        mode: 'local',
        p1: makeCombatant({ speciesId: ids[0], level: 10 }, catalog),
        p2: makeCombatant({ speciesId: ids[1], level: 10 }, catalog),
      },
      catalog,
    );
  }

  get state() {
    return publicState(this.battle.state);
  }

  async submitSkill(skillId) {
    const enemy = chooseAiSkill(this.battle.state, 'p2', getCatalog(), this.rng);
    const events = this.battle.resolveTurn({ p1: skillId, p2: enemy });
    return { events, state: this.state, rewards: null };
  }

  async forfeit() {
    return { events: this.battle.forfeit('p1'), state: this.state, rewards: null };
  }

  close() {}
}
