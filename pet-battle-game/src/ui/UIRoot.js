import { EVENT } from '@/config/constants.js';
import { h } from '@/utils/dom.js';
import { HpBar } from './components/HpBar.js';
import { SkillPanel } from './components/SkillPanel.js';
import { BattleLog } from './components/BattleLog.js';
import { ResultModal } from './components/ResultModal.js';
import './styles/main.css';

/** Battle HUD. Knows nothing about three.js or the rules, only how to show them. */
export class UIRoot {
  constructor(container) {
    this.hp = { player: HpBar({ align: 'left' }), enemy: HpBar({ align: 'right' }) };
    this.skills = SkillPanel();
    this.log = BattleLog();
    this.result = ResultModal();
    this.forfeitBtn = h('button', { class: 'forfeit', type: 'button' }, 'Leave');

    container.append(
      h('header', { class: 'hud' }, this.hp.player.el, this.forfeitBtn, this.hp.enemy.el),
      h('footer', { class: 'dock' }, this.log.el, this.skills.el),
      this.result.el,
    );
  }

  onForfeit(fn) {
    this.forfeitBtn.onclick = fn;
  }

  setCombatants(player, enemy) {
    this.hp.player.init(player);
    this.hp.enemy.init(enemy);
    this.log.clear();
    this.log.add(`${player.name} vs ${enemy.name}. Choose a skill.`);
  }

  showSkills(skills, onSelect) {
    this.skills.setSkills(skills, onSelect);
  }

  setSkillsEnabled(enabled) {
    this.skills.setEnabled(enabled);
  }

  /** Called when the hit lands (or after the animation), so HP drops in sync. Events are in player/enemy terms. */
  applyEvent(event) {
    switch (event.type) {
      case EVENT.ATTACK: {
        this.hp[event.targetSide].set(event.targetHp, event.targetMaxHp);
        const notes = [];
        if (event.crit) notes.push('critical hit');
        if (event.typeMul > 1) notes.push('super effective');
        if (event.typeMul < 1) notes.push('not very effective');
        this.log.add(`${event.actorName} used ${event.skillName}: -${event.damage} HP${notes.length ? ` (${notes.join(', ')})` : ''}`);
        break;
      }
      case EVENT.MISS:
        this.log.add(`${event.actorName} used ${event.skillName} but missed.`);
        break;
      case EVENT.FAINT:
        this.log.add(`${event.name} fainted.`);
        break;
    }
  }

  showResult(data, onContinue) {
    this.result.show(data, onContinue);
  }
}
