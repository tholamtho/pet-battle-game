import { h } from '@/utils/dom.js';
import { getItem, getSpecies } from '@/data/index.js';
import { eggsApi } from '@/api/eggsApi.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function EggsTab({ data, act }) {
  const { eggs, bag } = data;
  const free = eggs.slots - eggs.eggs.length;
  const boosts = bag.filter((b) => getItem(b.itemId)?.effect?.hatchSeconds);
  const timers = [];

  const rows = eggs.eggs.map((egg) => {
    const endAt = Date.now() + egg.remainingSeconds * 1000;
    const label = h('span', { class: 'timer' });
    const hatchBtn = h('button', { class: 'btn', type: 'button',
      onClick: () => act(() => eggsApi.hatch(egg.id), (r) => `A ${getSpecies(r.pet.speciesId).name} hatched!`) }, 'Hatch');
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      label.textContent = left ? fmt(left) : 'Ready!';
      hatchBtn.disabled = left > 0;
    };
    tick();
    timers.push(setInterval(tick, 1000));
    const boostBtns = boosts.map((b) => h('button', { class: 'btn btn--ghost', type: 'button',
      onClick: () => act(() => eggsApi.speedup(egg.id, b.itemId), () => 'Hatching sped up') }, `${getItem(b.itemId).name} ×${b.quantity}`));
    return h('li', { class: 'item' }, h('strong', {}, getItem(egg.itemId)?.name ?? egg.itemId), label, h('div', { class: 'row' }, hatchBtn, ...boostBtns));
  });

  const eggsInBag = bag.filter((b) => getItem(b.itemId)?.type === 'egg').map((b) =>
    h('button', { class: 'btn btn--ghost', type: 'button', disabled: free < 1,
      onClick: () => act(() => eggsApi.incubate(b.itemId), () => 'Egg placed in an incubator') }, `Incubate ${getItem(b.itemId).name} ×${b.quantity}`));

  return {
    el: h('div', { class: 'stack' },
      h('p', { class: 'screen__sub' }, `Incubators: ${eggs.eggs.length}/${eggs.slots}`),
      rows.length ? h('ul', { class: 'list' }, rows) : h('p', { class: 'screen__sub' }, 'No egg is incubating.'),
      eggsInBag.length ? h('div', { class: 'row' }, eggsInBag) : h('p', { class: 'screen__sub' }, 'No eggs in the bag. Find them in battle or buy one in the shop.')),
    cleanup: () => timers.forEach(clearInterval),
  };
}
