import { h } from '@/utils/dom.js';
import { getItem } from '@/data/index.js';
import { shopApi } from '@/api/shopApi.js';

export function ShopTab({ data, act }) {
  const gold = data.player.gold;
  return {
    el: h('div', { class: 'stack' }, h('p', { class: 'screen__sub' }, `Gold: ${gold}`),
      h('ul', { class: 'list' }, data.shop.map(({ itemId, price }) => {
        const it = getItem(itemId);
        return h('li', { class: `item item--${it?.rarity ?? 'common'}` },
          h('strong', {}, it?.name ?? itemId), h('span', {}, it?.description ?? ''),
          h('button', { class: 'btn', type: 'button', disabled: gold < price,
            onClick: () => act(() => shopApi.buy(itemId), () => `Bought ${it?.name ?? itemId}`) }, `Buy · ${price}`));
      }))),
  };
}
