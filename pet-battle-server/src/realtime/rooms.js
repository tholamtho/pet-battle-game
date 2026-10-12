import { Battle, BattleRuleError, P1, P2, SIDES, other, publicState } from '../modules/battle/engine/index.js';

const TURN_MS = 30_000; // pick a skill within this time or one is chosen for you
const GRACE_MS = 20_000; // time a disconnected player has to come back

class BattleRoom {
  constructor({ id, battle, users, deps }) {
    this.id = id;
    this.battle = battle;
    this.users = users; // { p1: userId, p2: userId }
    this.deps = deps;
    this.actions = {};
    this.offline = new Set();
    this.graceTimers = {};
    this.turnTimer = null;
    this.chain = Promise.resolve(); // serialises DB writes in order
  }

  sideOf(userId) {
    return SIDES.find((s) => this.users[s] === userId) ?? null;
  }

  #send(side, msg) {
    this.deps.hub.send(this.users[side], { battleId: this.id, ...msg });
  }

  #broadcast(msg) {
    SIDES.forEach((s) => this.#send(s, msg));
  }

  #persist(fn) {
    this.chain = this.chain.then(fn).catch((err) => this.deps.logger?.error({ err, battleId: this.id }, 'persist failed'));
  }

  start() {
    SIDES.forEach((side) => this.#send(side, { type: 'battle.start', you: side, state: publicState(this.battle.state) }));
    this.#armTurnTimer();
  }

  #armTurnTimer() {
    clearTimeout(this.turnTimer);
    this.turnTimer = setTimeout(() => this.#resolve(), this.deps.turnMs);
    this.turnTimer.unref?.();
  }

  submit(userId, skillId) {
    const side = this.sideOf(userId);
    if (!side) throw new BattleRuleError('NOT_IN_BATTLE', 'You are not in this battle');
    if (this.battle.isOver) throw new BattleRuleError('BATTLE_OVER', 'Battle is over');
    if (!this.battle.state.sides[side].skills.includes(skillId)) throw new BattleRuleError('INVALID_SKILL', 'Unknown skill');
    if (this.actions[side]) throw new BattleRuleError('ALREADY_SUBMITTED', 'Already chose a skill this turn');

    this.actions[side] = skillId;
    this.#send(side, { type: 'battle.action.ack', turn: this.battle.state.turn });
    this.#send(other(side), { type: 'battle.opponent_ready' });
    if (this.actions[P1] && this.actions[P2]) this.#resolve();
  }

  #resolve() {
    if (this.battle.isOver) return;
    clearTimeout(this.turnTimer);
    for (const side of SIDES) {
      if (!this.actions[side]) {
        const skills = this.battle.state.sides[side].skills;
        this.actions[side] = skills[Math.floor(Math.random() * skills.length)];
      }
    }
    const events = this.battle.resolveTurn(this.actions);
    this.actions = {};
    const { state } = this.battle;
    this.#broadcast({ type: 'battle.turn', events, state: publicState(state) });

    if (this.battle.isOver) {
      this.#persist(() => this.deps.repo.finish(this.id, { state, winner: state.winner, reason: 'ko' }));
      this.#dispose();
    } else {
      this.#persist(() => this.deps.repo.save(this.id, state));
      this.#armTurnTimer();
    }
  }

  forfeit(userId, reason = 'forfeit') {
    const side = this.sideOf(userId);
    if (!side || this.battle.isOver) return;
    this.#endEarly(side, reason);
  }

  #endEarly(loserSide, reason) {
    this.battle.forfeit(loserSide, reason);
    const { state } = this.battle;
    this.#broadcast({ type: 'battle.end', winner: state.winner, reason });
    this.#persist(() => this.deps.repo.finish(this.id, { state, winner: state.winner, reason }));
    this.#dispose();
  }

  onDisconnect(userId) {
    const side = this.sideOf(userId);
    if (!side || this.battle.isOver) return;
    this.offline.add(side);
    this.#send(other(side), { type: 'battle.opponent_disconnected', graceMs: this.deps.graceMs });
    this.graceTimers[side] = setTimeout(() => this.#endEarly(side, 'disconnect'), this.deps.graceMs);
    this.graceTimers[side].unref?.();
  }

  onReconnect(userId) {
    const side = this.sideOf(userId);
    if (!side || this.battle.isOver) return;
    clearTimeout(this.graceTimers[side]);
    this.offline.delete(side);
    this.#send(side, {
      type: 'battle.resume',
      you: side,
      state: publicState(this.battle.state),
      turn: this.battle.state.turn,
      submitted: Boolean(this.actions[side]),
    });
    this.#send(other(side), { type: 'battle.opponent_reconnected' });
  }

  #dispose() {
    clearTimeout(this.turnTimer);
    Object.values(this.graceTimers).forEach(clearTimeout);
    this.deps.onDispose(this);
  }
}

export class RoomManager {
  #rooms = new Map();
  #byUser = new Map();

  constructor({ hub, repo, logger, turnMs = TURN_MS, graceMs = GRACE_MS }) {
    this.deps = { hub, repo, logger, turnMs, graceMs, onDispose: (room) => this.#remove(room) };
  }

  has(userId) {
    return this.#byUser.has(userId);
  }

  #roomOf(userId) {
    return this.#rooms.get(this.#byUser.get(userId));
  }

  /** p1/p2: { userId, combatant } where combatant already carries meta { userId, petId }. */
  async create({ p1, p2 }, catalog) {
    const battle = Battle.create({ mode: 'pvp', p1: p1.combatant, p2: p2.combatant }, catalog);
    const row = await this.deps.repo.insert({ mode: 'pvp', p1User: p1.userId, p2User: p2.userId, state: battle.state });
    const room = new BattleRoom({ id: row.id, battle, users: { [P1]: p1.userId, [P2]: p2.userId }, deps: this.deps });
    this.#rooms.set(room.id, room);
    this.#byUser.set(p1.userId, room.id);
    this.#byUser.set(p2.userId, room.id);
    room.start();
    return room;
  }

  #remove(room) {
    this.#rooms.delete(room.id);
    for (const userId of Object.values(room.users)) {
      if (this.#byUser.get(userId) === room.id) this.#byUser.delete(userId);
    }
  }

  #require(userId, battleId) {
    const room = this.#roomOf(userId);
    if (!room || room.id !== battleId) throw new BattleRuleError('NOT_IN_BATTLE', 'No such active battle');
    return room;
  }

  submit(userId, battleId, skillId) {
    this.#require(userId, battleId).submit(userId, skillId);
  }

  forfeit(userId, battleId) {
    this.#require(userId, battleId).forfeit(userId);
  }

  onDisconnect(userId) {
    this.#roomOf(userId)?.onDisconnect(userId);
  }

  onReconnect(userId) {
    this.#roomOf(userId)?.onReconnect(userId);
  }
}
