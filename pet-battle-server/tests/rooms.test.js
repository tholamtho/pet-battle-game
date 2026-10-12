import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../src/realtime/rooms.js';
import { makeCombatant } from '../src/modules/battle/engine/index.js';
import { testCatalog } from './fixtures/catalog.js';

const catalog = testCatalog();
const BID = '11111111-1111-4111-8111-111111111111';

function setup(opts = {}) {
  const sent = [];
  const hub = { send: (userId, msg) => sent.push({ to: userId, ...msg }), get: () => ({}) };
  const repo = { insert: vi.fn(async () => ({ id: BID })), save: vi.fn(async () => {}), finish: vi.fn(async () => {}) };
  const rooms = new RoomManager({ hub, repo, turnMs: 1000, graceMs: 500, ...opts });
  const c = (id, species) => ({ userId: id, combatant: makeCombatant({ speciesId: species, level: 5, meta: { userId: id, petId: id } }, catalog) });
  return { sent, repo, rooms, create: () => rooms.create({ p1: c('u1', 'fast'), p2: c('u2', 'slow') }, catalog), of: (type) => sent.filter((m) => m.type === type) };
}

describe('PvP rooms', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts for both players with the right side', async () => {
    const t = setup();
    await t.create();
    const starts = t.of('battle.start');
    expect(starts.map((m) => [m.to, m.you])).toEqual([['u1', 'p1'], ['u2', 'p2']]);
    expect(starts[0].state.seed).toBeUndefined();
  });

  it('resolves the turn once both have chosen, and not before', async () => {
    const t = setup();
    await t.create();
    t.rooms.submit('u1', BID, 'tackle');
    expect(t.of('battle.turn')).toHaveLength(0);
    expect(t.of('battle.opponent_ready')[0].to).toBe('u2');
    t.rooms.submit('u2', BID, 'tackle');
    expect(t.of('battle.turn')).toHaveLength(2);
    expect(() => t.rooms.submit('u1', BID, 'nope')).toThrow();
  });

  it('rejects choosing twice in one turn', async () => {
    const t = setup();
    await t.create();
    t.rooms.submit('u1', BID, 'tackle');
    expect(() => t.rooms.submit('u1', BID, 'big')).toThrow(/Already/);
  });

  it('auto-picks for a player who runs out of time', async () => {
    const t = setup();
    await t.create();
    t.rooms.submit('u1', BID, 'tackle');
    await vi.advanceTimersByTimeAsync(1100);
    expect(t.of('battle.turn')).toHaveLength(2);
  });

  it('forfeits a player who stays disconnected past the grace period', async () => {
    const t = setup();
    await t.create();
    t.rooms.onDisconnect('u2');
    expect(t.of('battle.opponent_disconnected')[0].to).toBe('u1');
    await vi.advanceTimersByTimeAsync(600);
    const end = t.of('battle.end');
    expect(end[0]).toMatchObject({ winner: 'p1', reason: 'disconnect' });
    expect(t.rooms.has('u1')).toBe(false);
    expect(t.repo.finish).toHaveBeenCalled();
  });

  it('lets a player reconnect in time and resends the state', async () => {
    const t = setup();
    await t.create();
    t.rooms.onDisconnect('u2');
    await vi.advanceTimersByTimeAsync(200);
    t.rooms.onReconnect('u2');
    expect(t.of('battle.resume')[0]).toMatchObject({ to: 'u2', you: 'p2' });
    await vi.advanceTimersByTimeAsync(600);
    expect(t.of('battle.end')).toHaveLength(0);
  });
});
