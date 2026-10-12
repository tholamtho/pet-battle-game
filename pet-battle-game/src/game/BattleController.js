import { EVENT } from '@/config/constants.js';
import { getItem, getSkill, getSpecies } from '@/data/index.js';
import { logger } from '@/utils/logger.js';
import { toViewEvent, viewCombatants, viewSide } from './perspective.js';

/**
 * Plays any battle session (offline, wild, PvP) on the stage and HUD.
 * Rules live in the engine/server; this class only turns results into animation + UI.
 */
export class BattleController {
  #queue = Promise.resolve();

  constructor({ scene, ui }) {
    this.scene = scene;
    this.ui = ui;
  }

  /** Resolves when the player dismisses the result screen. */
  async run(session) {
    this.session = session;
    this.over = false;
    this.#queue = Promise.resolve();

    const { player, enemy } = viewCombatants(session.state, session.you);
    await this.scene.setCombatants(getSpecies(player.speciesId), getSpecies(enemy.speciesId), { player: player.equipment, enemy: enemy.equipment });
    this.ui.setCombatants(player, enemy);
    this.ui.showSkills(player.skills.map(getSkill), (id) => this.#choose(id));
    this.ui.onForfeit(() => this.#forfeit());
    this.ui.setSkillsEnabled(true);

    session.onStatus = (text) => this.ui.log.add(text);
    session.onUnsolicitedTurn = (result) => this.#enqueue(result);

    return new Promise((resolve) => {
      this.done = resolve;
      session.onForcedEnd = ({ winner, reason }) => {
        const won = viewSide(winner, session.you) === 'player';
        const text = reason === 'disconnect' ? (won ? 'Your opponent disconnected.' : 'You were disconnected.') : won ? 'Your opponent left the battle.' : 'You left the battle.';
        this.#finish(won, text);
      };
    });
  }

  async #choose(skillId) {
    if (this.over || this.busy) return;
    this.busy = true;
    this.ui.setSkillsEnabled(false);
    try {
      await this.#enqueue(await this.session.submitSkill(skillId));
    } catch (err) {
      if (err.name === 'SessionEnded') return;
      logger.warn('Turn failed', err);
      this.ui.log.add(err.message || 'Something went wrong, try again.');
      if (!this.over) this.ui.setSkillsEnabled(true);
    } finally {
      this.busy = false;
    }
  }

  async #forfeit() {
    if (this.over) return;
    try {
      const result = await this.session.forfeit();
      if (result) await this.#enqueue(result);
    } catch (err) {
      logger.warn('Forfeit failed', err);
    }
  }

  /** Turns are played strictly one after another, even if the network delivers them early. */
  #enqueue(result) {
    this.#queue = this.#queue.then(() => this.#play(result)).catch((err) => logger.error('Playback failed', err));
    return this.#queue;
  }

  async #play({ events, rewards }) {
    for (const raw of events) {
      const event = toViewEvent(raw, this.session.you);
      let applied = false;
      const apply = () => {
        if (!applied) {
          applied = true;
          this.ui.applyEvent(event);
        }
      };
      await this.scene.playEvent(event, { onImpact: apply });
      apply();
      if (event.type === EVENT.END) return this.#finish(event.winner === 'player', this.#rewardText(rewards));
    }
    if (!this.over) this.ui.setSkillsEnabled(true);
  }

  #rewardText(r) {
    if (!r) return '';
    const parts = [`+${r.exp} exp`, `+${r.gold} gold`];
    const found = (r.drops ?? []).map((d) => `${getItem(d.itemId)?.name ?? d.itemId} ×${d.quantity}`);
    if (found.length) parts.push(`found ${found.join(', ')}`);
    if (r.pet && r.pet.levelAfter > r.pet.levelBefore) parts.push(`your pet reached level ${r.pet.levelAfter}!`);
    if (r.player && r.player.levelAfter > r.player.levelBefore) parts.push(`trainer level ${r.player.levelAfter}!`);
    return parts.join(' · ');
  }

  #finish(won, text) {
    if (this.over) return;
    this.over = true;
    this.ui.setSkillsEnabled(false);
    this.ui.showResult({ title: won ? 'Victory' : 'Defeat', text }, () => this.done());
  }
}
