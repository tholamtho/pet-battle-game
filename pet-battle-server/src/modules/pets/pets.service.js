import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as speciesRepo from '../species/species.repo.js';
import * as inventoryRepo from '../inventory/inventory.repo.js';
import { applyExp, expToNext } from '../battle/progression.js';
import * as repo from './pets.repo.js';

/** Adds fields the client needs to render a pet screen without duplicating game rules. */
function withDerived(pet) {
  return { ...pet, expToNext: expToNext(pet.level), evolution: getCatalog().species.get(pet.speciesId)?.evolution ?? null };
}

export async function list(ownerId, db) {
  return (await repo.listByOwner(ownerId, db)).map(withDerived);
}

export async function get(ownerId, id, db) {
  const pet = await repo.findOwned(id, ownerId, db);
  if (!pet) throw notFound('Pet');
  return { ...withDerived(pet), skills: await speciesRepo.skillsFor(pet.speciesId, pet.level, db) };
}

export async function assertOwned(ownerId, id, db) {
  if (!(await repo.findOwned(id, ownerId, db))) throw notFound('Pet');
}

/** Gives a pet to a player (starter, egg, rewards). */
export async function grantPet(ownerId, { speciesId, level = 5, nickname = null }, db) {
  const teamSlot = await repo.nextFreeTeamSlot(ownerId, db);
  return withDerived(await repo.insert({ ownerId, speciesId, level, nickname, teamSlot }, db));
}

/** Adds exp and applies level-ups. Used by battle rewards and exp candy. */
export async function addExp(ownerId, petId, gain, db) {
  const pet = await repo.findOwned(petId, ownerId, db, { forUpdate: true });
  if (!pet) throw notFound('Pet');
  const next = applyExp(pet, gain);
  await repo.setProgress(petId, ownerId, next, db);
  return { id: petId, levelBefore: pet.level, levelAfter: next.level, exp: next.exp, expToNext: expToNext(next.level) };
}

export async function rename(ownerId, id, nickname) {
  await assertOwned(ownerId, id);
  await repo.updateNickname(id, ownerId, nickname);
  return get(ownerId, id);
}

export async function setTeam(ownerId, petIds) {
  await withTransaction(async (db) => {
    if ((await repo.countOwnedAmong(ownerId, petIds, db)) !== petIds.length) {
      throw badRequest('Team contains pets you do not own');
    }
    await repo.replaceTeam(ownerId, petIds, db);
  });
  return list(ownerId);
}

export async function release(ownerId, id) {
  await withTransaction(async (db) => {
    if (!(await repo.findOwned(id, ownerId, db, { forUpdate: true }))) throw notFound('Pet');
    if ((await repo.countByOwner(ownerId, db)) <= 1) throw conflict('You cannot release your last pet');
    await repo.remove(id, ownerId, db);
  });
}

/** Evolution rules live in the species table: level, plus an optional item that is consumed. */
export function evolve(ownerId, id) {
  return withTransaction(async (db) => {
    const pet = await repo.findOwned(id, ownerId, db, { forUpdate: true });
    if (!pet) throw notFound('Pet');
    const evo = getCatalog().species.get(pet.speciesId)?.evolution;
    if (!evo) throw conflict('This pet cannot evolve');
    if (pet.level < evo.level) throw conflict(`Needs level ${evo.level} to evolve`);
    if (evo.itemId && !(await inventoryRepo.remove(ownerId, evo.itemId, 1, db))) {
      throw conflict(`Needs ${getCatalog().items.get(evo.itemId)?.name ?? evo.itemId}`);
    }
    await repo.setSpecies(id, ownerId, evo.to, db);
    return { from: pet.speciesId, pet: await get(ownerId, id, db) };
  });
}
