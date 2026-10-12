import { BattleRuleError, makeCombatant } from '../modules/battle/engine/index.js';
import { getCatalog } from '../modules/catalog/catalog.service.js';
import * as petsRepo from '../modules/pets/pets.repo.js';
import { AppError } from '../common/errors.js';

/** One function per client message type. Throwing sends an `error` message to that client. */
export function createHandlers({ hub, matchmaker, rooms }) {
  const need = (conn) => {
    if (!conn.userId) throw new AppError(401, 'UNAUTHORIZED', 'Send an auth message first');
    return conn.userId;
  };

  return {
    ping: (conn) => conn.send({ type: 'pong' }),

    async 'queue.join'(conn, msg) {
      const userId = need(conn);
      if (rooms.has(userId)) return rooms.onReconnect(userId); // already fighting: just resend the state
      if (matchmaker.has(userId)) return conn.send({ type: 'queue.joined' });
      const pet = msg.petId ? await petsRepo.findOwned(msg.petId, userId) : await petsRepo.findTeamLead(userId);
      if (!pet) throw new AppError(409, 'NO_PET', 'You have no pet to fight with');
      matchmaker.join({ userId, petId: pet.id });
      conn.send({ type: 'queue.joined' });
    },

    'queue.leave'(conn) {
      matchmaker.leave(need(conn));
      conn.send({ type: 'queue.left' });
    },

    'battle.action'(conn, msg) {
      rooms.submit(need(conn), msg.battleId, msg.skillId);
    },

    'battle.forfeit'(conn, msg) {
      rooms.forfeit(need(conn), msg.battleId);
    },
  };
}

/** Called by the matchmaker when two players are paired. */
export function createMatchHandler({ hub, matchmaker, rooms, logger }) {
  return async (a, b) => {
    try {
      if (!hub.get(a.userId) || !hub.get(b.userId)) {
        // one of them left while waiting: put the other one back in the queue
        for (const e of [a, b]) if (hub.get(e.userId)) matchmaker.join(e);
        return;
      }
      const catalog = getCatalog();
      const build = async (entry) => {
        const pet = await petsRepo.findOwned(entry.petId, entry.userId);
        const combatant = makeCombatant(
          { speciesId: pet.speciesId, level: pet.level, name: pet.nickname, equipment: pet.equipment, meta: { userId: entry.userId, petId: pet.id } },
          catalog,
        );
        return { userId: entry.userId, combatant };
      };
      await rooms.create({ p1: await build(a), p2: await build(b) }, catalog);
    } catch (err) {
      logger?.error({ err }, 'match creation failed');
      for (const e of [a, b]) hub.send(e.userId, { type: 'error', code: 'MATCH_FAILED', message: 'Could not start the match, try again' });
    }
  };
}

export const toErrorMessage = (err) => {
  if (err instanceof AppError) return { type: 'error', code: err.code, message: err.message };
  if (err instanceof BattleRuleError) return { type: 'error', code: err.code, message: err.message };
  return { type: 'error', code: 'INTERNAL', message: 'Something went wrong' };
};
