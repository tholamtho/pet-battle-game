import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as playersRepo from '../players/players.repo.js';
import * as petsRepo from '../pets/pets.repo.js';
import * as petsService from '../pets/pets.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as mapsRepo from '../maps/maps.repo.js';
import { rollEncounter } from '../maps/encounter.js';
import { Battle, BattleRuleError, P1, P2, chooseAiSkill, createRng, makeCombatant, publicState } from './engine/index.js';
import { playerLevelFromExp, rewardsFor } from './progression.js';
import { rollDrops } from './drops.js';
import * as repo from './battles.repo.js';

const view = (row, you) => ({ battleId: row.id, mode: row.mode, you, status: row.status, state: publicState(row.state) });

const youOf = (row, userId) => (row.p1User === userId ? P1 : row.p2User === userId ? P2 : null);

async function loadOwn(userId, id, db, opts) {
  const row = await repo.findById(id, db, opts);
  const you = row && youOf(row, userId);
  if (!you) throw notFound('Battle');
  return { row, you };
}

export async function getActive(userId) {
  const row = await repo.findActivePve(userId);
  return row ? view(row, P1) : null;
}

export async function get(userId, id) {
  const { row, you } = await loadOwn(userId, id);
  return view(row, you);
}

/** Starts a wild battle on the player's current map, or returns the one already in progress. */
export function startPve(userId, { petId } = {}) {
  return withTransaction(async (db) => {
    await playersRepo.lock(userId, db);
    const existing = await repo.findActivePve(userId, db);
    if (existing) return view(existing, P1);

    const player = await playersRepo.findByUserId(userId, db);
    if (!player?.currentMapId) throw conflict('Enter a map first');
    const pet = petId ? await petsRepo.findOwned(petId, userId, db) : await petsRepo.findTeamLead(userId, db);
    if (!pet) throw petId ? notFound('Pet') : conflict('You have no pets yet');
    const encounters = await mapsRepo.listEncounters(player.currentMapId, db);
    if (!encounters.length) throw conflict('Nothing to encounter on this map');

    const catalog = getCatalog();
    const wild = rollEncounter(encounters);
    const battle = Battle.create(
      {
        mode: 'pve',
        p1: makeCombatant(
          { speciesId: pet.speciesId, level: pet.level, name: pet.nickname, equipment: pet.equipment, meta: { userId, petId: pet.id } },
          catalog,
        ),
        p2: makeCombatant({ speciesId: wild.speciesId, level: wild.level }, catalog),
      },
      catalog,
    );
    battle.state.mapId = player.currentMapId; // used for drops; not exposed by publicState
    return view(await repo.insert({ mode: 'pve', p1User: userId, state: battle.state }, db), P1);
  });
}

/** exp + gold + item drops, applied in the same transaction as the battle result. */
async function grantRewards(userId, state, db) {
  const reward = rewardsFor(state.sides[P2].level);
  const out = { exp: reward.exp, gold: reward.gold, pet: null, player: null, drops: [] };

  const petId = state.sides[P1].petId;
  if (petId) {
    try {
      out.pet = await petsService.addExp(userId, petId, reward.exp, db);
    } catch (err) {
      if (err.status !== 404) throw err; // the pet was released mid-battle: it just gets no exp
    }
  }

  const player = await playersRepo.findByUserId(userId, db);
  const totalExp = player.exp + reward.exp;
  const level = playerLevelFromExp(totalExp);
  await playersRepo.setProgress(userId, { level, exp: totalExp, gold: player.gold + reward.gold }, db);
  out.player = { levelBefore: player.level, levelAfter: level, gold: player.gold + reward.gold };

  if (state.mapId) {
    for (const drop of rollDrops(await mapsRepo.listDrops(state.mapId, db))) {
      await inventoryService.grant(userId, drop.itemId, drop.quantity, db);
      out.drops.push(drop);
    }
  }
  return out;
}

export function submitTurn(userId, id, skillId) {
  return withTransaction(async (db) => {
    const { row, you } = await loadOwn(userId, id, db, { forUpdate: true });
    if (row.mode !== 'pve') throw badRequest('PvP turns are sent over the WebSocket');
    if (row.status !== 'active') throw conflict('Battle already finished');

    const catalog = getCatalog();
    const battle = new Battle(row.state, catalog);
    const aiRng = createRng((battle.state.seed ^ 0x9e3779b9) + battle.state.turn);

    let events;
    try {
      events = battle.resolveTurn({ [P1]: skillId, [P2]: chooseAiSkill(battle.state, P2, catalog, aiRng) });
    } catch (err) {
      if (err instanceof BattleRuleError) throw badRequest(err.message, { code: err.code });
      throw err;
    }

    let rewards = null;
    if (battle.isOver) {
      if (battle.state.winner === P1) rewards = await grantRewards(userId, battle.state, db);
      await repo.finish(row.id, { state: battle.state, winner: battle.state.winner, reason: 'ko' }, db);
    } else {
      await repo.save(row.id, battle.state, db);
    }
    return { battleId: row.id, you, events, state: publicState(battle.state), rewards };
  });
}

export function forfeit(userId, id) {
  return withTransaction(async (db) => {
    const { row, you } = await loadOwn(userId, id, db, { forUpdate: true });
    if (row.status !== 'active') throw conflict('Battle already finished');
    const battle = new Battle(row.state, getCatalog());
    const events = battle.forfeit(you);
    await repo.finish(row.id, { state: battle.state, winner: battle.state.winner, reason: 'forfeit' }, db);
    return { battleId: row.id, you, events, state: publicState(battle.state), rewards: null };
  });
}
