import { h } from '@/utils/dom.js';
import { SLOTS } from '@/render/animation/config.js';
import { getItem, getSpecies } from '@/data/index.js';
import { petsApi } from '@/api/petsApi.js';
import { inventoryApi } from '@/api/inventoryApi.js';

const itemName = (id) => getItem(id)?.name ?? id;

export function PetsTab({ data, act, state }) {
  const { pets, bag } = data;
  const qty = (id) => bag.find((b) => b.itemId === id)?.quantity ?? 0;
  const pet = pets.find((p) => p.id === state.petId) ?? pets[0];
  if (!pet) return { el: h('p', { class: 'screen__sub' }, 'You have no pets yet.') };
  state.petId = pet.id;

  const list = h('div', { class: 'row' }, pets.map((p) =>
    h('button', { class: `chip${p.id === pet.id ? ' chip--on' : ''}`, type: 'button', onClick: () => ((state.petId = p.id), act(async () => {})) },
      `${p.nickname || p.speciesName} Lv.${p.level}`)));

  const expBar = h('div', { class: 'bar', title: `${pet.exp} / ${pet.expToNext} exp` }, h('div', { class: 'bar__fill', style: `width:${Math.min(100, (pet.exp / pet.expToNext) * 100)}%` }));

  // Equipment: one dropdown per slot, listing what is on the pet and what the bag holds for that slot.
  const equipped = Object.fromEntries(pet.equipment.map((e) => [e.slot, e.itemId]));
  const slots = SLOTS.map((slot) => {
    const options = [h('option', { value: '' }, '(empty)')];
    if (equipped[slot]) options.push(h('option', { value: equipped[slot], selected: true }, `${itemName(equipped[slot])} (worn)`));
    for (const b of bag) {
      const it = getItem(b.itemId);
      if (it?.type === 'equipment' && it.slot === slot && b.itemId !== equipped[slot]) options.push(h('option', { value: b.itemId }, `${it.name} ×${b.quantity}`));
    }
    return h('label', { class: 'slot' }, h('span', {}, slot),
      h('select', { class: 'field', onChange: (e) => act(() => (e.target.value ? petsApi.equip(pet.id, slot, e.target.value) : petsApi.unequip(pet.id, slot))) }, options));
  });

  const candies = bag.filter((b) => getItem(b.itemId)?.effect?.exp).map((b) =>
    h('button', { class: 'btn btn--ghost', type: 'button',
      onClick: () => act(() => inventoryApi.use(b.itemId, pet.id), (r) => `${pet.speciesName} is now level ${r.progress.levelAfter}`) },
      `${itemName(b.itemId)} ×${b.quantity}`));

  let evolution = null;
  if (pet.evolution) {
    const e = pet.evolution;
    const lacksItem = e.itemId && qty(e.itemId) < 1;
    const ready = pet.level >= e.level && !lacksItem;
    evolution = h('div', {},
      h('p', { class: 'screen__sub' }, `Evolves into ${getSpecies(e.to).name} at level ${e.level}${e.itemId ? ` with ${itemName(e.itemId)}` : ''}.`),
      h('button', { class: 'btn', type: 'button', disabled: !ready,
        onClick: () => act(() => petsApi.evolve(pet.id), (r) => `${getSpecies(r.from).name} evolved into ${getSpecies(r.pet.speciesId).name}!`) }, 'Evolve'));
  }

  return {
    el: h('div', { class: 'stack' }, list,
      h('p', { class: 'screen__sub' }, `${pet.nickname || pet.speciesName} · level ${pet.level} · ${pet.exp}/${pet.expToNext} exp`), expBar,
      h('h3', { class: 'hub__h' }, 'Equipment'), h('div', { class: 'slots' }, slots),
      h('h3', { class: 'hub__h' }, 'Level up'), candies.length ? h('div', { class: 'row' }, candies) : h('p', { class: 'screen__sub' }, 'No exp candy in the bag. Win battles or visit the shop.'),
      evolution),
  };
}
