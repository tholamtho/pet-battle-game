import { h } from '@/utils/dom.js';

export function BattleLog(max = 40) {
  const el = h('ul', { class: 'log', 'aria-live': 'polite' });

  function add(text) {
    el.append(h('li', {}, text));
    while (el.children.length > max) el.firstChild.remove();
    el.scrollTop = el.scrollHeight;
  }

  return { el, add, clear: () => el.replaceChildren() };
}
