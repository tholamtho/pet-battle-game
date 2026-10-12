import { describe, it, expect } from 'vitest';
import { Battle, makeCombatant, publicState, chooseAiSkill, createRng, EVENT, P1, P2, BattleRuleError } from '../src/modules/battle/engine/index.js';
import { testCatalog } from './fixtures/catalog.js';

const catalog = testCatalog();
const make = (seed = 1, a = 'fast', b = 'slow') =>
  Battle.create(
    { mode: 'pve', seed, p1: makeCombatant({ speciesId: a, level: 5, meta: { userId: 'u1', petId: 'p1' } }, catalog), p2: makeCombatant({ speciesId: b, level: 5 }, catalog) },
    catalog,
  );

describe('Battle engine', () => {
  it('is deterministic for a given seed', () => {
    const a = make(42).resolveTurn({ p1: 'tackle', p2: 'tackle' });
    const b = make(42).resolveTurn({ p1: 'tackle', p2: 'tackle' });
    expect(a).toEqual(b);
  });

  it('survives a JSON round trip (state is stored in the DB)', () => {
    const b1 = make(7);
    const b2 = new Battle(JSON.parse(JSON.stringify(b1.state)), catalog);
    expect(b2.resolveTurn({ p1: 'big', p2: 'tackle' })).toEqual(b1.resolveTurn({ p1: 'big', p2: 'tackle' }));
  });

  it('higher priority acts first, then speed', () => {
    expect(make(1).resolveTurn({ p1: 'tackle', p2: 'quick' })[0].side).toBe(P2);
    expect(make(1).resolveTurn({ p1: 'tackle', p2: 'tackle' })[0].side).toBe(P1);
  });

  it('plays until someone wins, ends with END, hp never below 0', () => {
    const battle = make(3);
    let last = [];
    for (let i = 0; i < 50 && !battle.isOver; i++) last = battle.resolveTurn({ p1: 'big', p2: 'tackle' });
    expect(battle.isOver).toBe(true);
    expect(last.at(-1).type).toBe(EVENT.END);
    for (const s of [P1, P2]) expect(battle.state.sides[s].hp).toBeGreaterThanOrEqual(0);
  });

  it('rejects unknown skills and turns after the end', () => {
    expect(() => make().resolveTurn({ p1: 'nope', p2: 'tackle' })).toThrow(BattleRuleError);
    const b = make();
    b.forfeit(P1);
    expect(() => b.resolveTurn({ p1: 'tackle', p2: 'tackle' })).toThrow(/over/);
  });

  it('forfeit gives the win to the other side', () => {
    const b = make();
    const [end] = b.forfeit(P2, 'disconnect');
    expect(end).toMatchObject({ type: EVENT.END, winner: P1, reason: 'disconnect' });
  });

  it('publicState hides seed and user ids', () => {
    const s = publicState(make().state);
    expect(s.seed).toBeUndefined();
    expect(s.sides.p1.userId).toBeUndefined();
    expect(s.sides.p1.petId).toBeUndefined();
  });

  it('equipment adds flat stat bonuses and is kept on the combatant', () => {
    const plain = makeCombatant({ speciesId: 'fast', level: 5 }, catalog);
    const geared = makeCombatant({ speciesId: 'fast', level: 5, equipment: [{ slot: 'head', itemId: 'hat' }, { slot: 'accessory', itemId: 'ring' }] }, catalog);
    expect(geared.stats.def).toBe(plain.stats.def + 3);
    expect(geared.stats.speed).toBe(plain.stats.speed + 2);
    expect(geared.maxHp).toBe(plain.maxHp + 8);
    expect(geared.hp).toBe(geared.maxHp);
    expect(geared.equipment).toEqual([{ slot: 'head', itemId: 'hat' }, { slot: 'accessory', itemId: 'ring' }]);
  });

  it('ignores unknown equipment ids instead of crashing', () => {
    expect(() => makeCombatant({ speciesId: 'fast', level: 5, equipment: [{ slot: 'head', itemId: 'nope' }] }, catalog)).not.toThrow();
  });

  it('AI always returns one of its own skills', () => {
    const b = make();
    for (let i = 0; i < 20; i++) expect(b.state.sides.p2.skills).toContain(chooseAiSkill(b.state, P2, catalog, createRng(i)));
  });
});
