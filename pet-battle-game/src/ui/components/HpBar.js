import { h } from '@/utils/dom.js';
import { clamp } from '@/utils/math.js';

export function HpBar({ align = 'left' } = {}) {
  const name = h('span', { class: 'hp__name' });
  const level = h('span', { class: 'hp__level' });
  const fill = h('div', { class: 'hp__fill' });
  const value = h('span', { class: 'hp__value' });
  const el = h(
    'div',
    { class: `hp hp--${align}` },
    h('div', { class: 'hp__head' }, name, level),
    h('div', { class: 'hp__track', role: 'progressbar' }, fill),
    value,
  );

  function set(hp, max) {
    const ratio = clamp(hp / max, 0, 1);
    fill.style.width = `${ratio * 100}%`;
    fill.dataset.level = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
    value.textContent = `${hp} / ${max}`;
    el.querySelector('.hp__track').setAttribute('aria-valuenow', String(hp));
  }

  function init(combatant) {
    name.textContent = combatant.name;
    level.textContent = `Lv.${combatant.level}`;
    set(combatant.hp, combatant.maxHp);
  }

  return { el, init, set };
}
