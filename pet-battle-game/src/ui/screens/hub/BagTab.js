import { h } from '@/utils/dom.js';
import { getItem } from '@/data/index.js';

export function BagTab({ data }) {
  if (!data.bag.length) return { el: h('p', { class: 'screen__sub' }, 'Your bag is empty.') };
  return {
    el: h('ul', { class: 'list' }, data.bag.map((b) => {
      const it = getItem(b.itemId);
      return h('li', { class: `item item--${it?.rarity ?? 'common'}` },
        h('strong', {}, `${it?.name ?? b.itemId} ×${b.quantity}`), h('span', {}, it?.description ?? ''));
    })),
  };
}
