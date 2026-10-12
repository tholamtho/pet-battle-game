import { h } from '@/utils/dom.js';
import { playersApi } from '@/api/playersApi.js';
import { petsApi } from '@/api/petsApi.js';
import { inventoryApi } from '@/api/inventoryApi.js';
import { eggsApi } from '@/api/eggsApi.js';
import { shopApi } from '@/api/shopApi.js';
import { PetsTab } from './hub/PetsTab.js';
import { BagTab } from './hub/BagTab.js';
import { EggsTab } from './hub/EggsTab.js';
import { ShopTab } from './hub/ShopTab.js';

const TABS = [
  ['pets', 'Pets', PetsTab],
  ['bag', 'Bag', BagTab],
  ['eggs', 'Eggs', EggsTab],
  ['shop', 'Shop', ShopTab],
];

/**
 * Pets (equipment, exp candy, evolution), bag, eggs and shop in one tabbed screen.
 * Every action goes through act(): call the server, reload everything, repaint, show a message.
 */
export function HubScreen({ onBack }) {
  const el = h('div', { class: 'screen__card screen__card--wide' });
  const message = h('p', { class: 'screen__error', role: 'status' });
  const state = {}; // survives repaints (selected pet)
  let tab = 'pets';
  let data = null;
  let cleanup = null;

  const say = (text, isError = false) => {
    message.textContent = text ?? '';
    message.className = isError ? 'screen__error' : 'screen__ok';
  };

  async function load() {
    const [player, pets, bag, eggs, shop] = await Promise.all([playersApi.me(), petsApi.list(), inventoryApi.list(), eggsApi.list(), shopApi.list()]);
    data = { player, pets, bag, eggs, shop };
    paint();
  }

  async function act(fn, okMessage) {
    say('');
    try {
      const result = await fn();
      await load();
      if (okMessage) say(typeof okMessage === 'function' ? okMessage(result) : okMessage);
    } catch (err) {
      say(err.message, true);
    }
  }

  function paint() {
    cleanup?.();
    const { el: content, cleanup: next } = TABS.find(([id]) => id === tab)[2]({ data, act, state });
    cleanup = next;
    el.replaceChildren(
      h('div', { class: 'tabs' }, TABS.map(([id, label]) => h('button', { class: `tab${id === tab ? ' tab--on' : ''}`, type: 'button', onClick: () => ((tab = id), say(''), paint()) }, label))),
      content,
      message,
      h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => (cleanup?.(), onBack()) }, 'Back'),
    );
  }

  return { el, load };
}
