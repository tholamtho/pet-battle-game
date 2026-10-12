import { h } from '@/utils/dom.js';

export function MenuScreen({ onStarter, onWild, onPvp, onHub, onPractice, onLogout }) {
  const el = h('div', { class: 'screen__card' });
  const status = h('p', { class: 'screen__error', role: 'alert' });

  async function guarded(fn) {
    status.textContent = '';
    el.querySelectorAll('button').forEach((b) => (b.disabled = true));
    try {
      await fn();
    } catch (err) {
      status.textContent = err.message;
      el.querySelectorAll('button').forEach((b) => (b.disabled = false));
    }
  }

  function render({ player, pets, maps, starters }) {
    const children = [
      h('h1', { class: 'screen__title' }, player.username),
      h('p', { class: 'screen__sub' }, `Trainer level ${player.level} · ${player.gold} gold`),
    ];

    if (!pets.length) {
      children.push(
        h('p', { class: 'screen__sub' }, 'Choose your first pet'),
        h('div', { class: 'row' }, starters.map((s) => h('button', { class: 'btn', type: 'button', onClick: () => guarded(() => onStarter(s.id)) }, s.name))),
      );
    } else {
      const select = h('select', { class: 'field', 'aria-label': 'Map' },
        maps.map((m) => h('option', { value: m.id, disabled: !m.unlocked, selected: m.id === player.currentMapId }, m.unlocked ? m.name : `${m.name} (needs level ${m.minLevel})`)));
      children.push(
        h('ul', { class: 'pets' }, pets.map((p) => h('li', {}, `${p.nickname || p.speciesName} · Lv.${p.level}${p.teamSlot ? ` · team ${p.teamSlot}` : ''}`))),
        select,
        h('button', { class: 'btn', type: 'button', onClick: () => guarded(() => onWild(select.value)) }, 'Wild battle'),
        h('button', { class: 'btn', type: 'button', onClick: () => guarded(() => onPvp()) }, 'Find a PvP match'),
        h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => guarded(() => onHub()) }, 'Pets, bag, eggs & shop'),
      );
    }
    children.push(
      status,
      h('button', { class: 'btn btn--ghost', type: 'button', onClick: onPractice }, 'Practice offline'),
      h('button', { class: 'btn btn--ghost', type: 'button', onClick: onLogout }, 'Log out'),
    );
    el.replaceChildren(...children);
  }

  return { el, render, setStatus: (t) => (status.textContent = t) };
}

export function QueueScreen({ onCancel }) {
  return {
    el: h('div', { class: 'screen__card' },
      h('h1', { class: 'screen__title' }, 'Looking for an opponent'),
      h('p', { class: 'screen__sub' }, 'Waiting for another trainer to join the queue...'),
      h('button', { class: 'btn btn--ghost', type: 'button', onClick: onCancel }, 'Cancel')),
  };
}
