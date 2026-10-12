/**
 * PvP over the WebSocket. submitSkill() resolves when the server resolves the turn (after BOTH players chose).
 * If a turn arrives without us having chosen (we timed out, or reconnected), it goes to onUnsolicitedTurn.
 */
export class PvpSession {
  #pending = null;
  #offs = [];

  constructor(socket, { battleId, you, state }) {
    this.socket = socket;
    this.id = battleId;
    this.you = you;
    this.state = state;
    this.onStatus = null;
    this.onUnsolicitedTurn = null;
    this.onForcedEnd = null;

    const mine = (fn) => (m) => m.battleId === this.id && fn(m);
    this.#offs = [
      socket.on('battle.turn', mine((m) => this.#turn(m))),
      socket.on('battle.end', mine((m) => this.#end(m))),
      socket.on('battle.opponent_ready', mine(() => this.onStatus?.('Opponent has chosen.'))),
      socket.on('battle.opponent_disconnected', mine((m) => this.onStatus?.(`Opponent disconnected. Waiting ${Math.round(m.graceMs / 1000)}s for them to return.`))),
      socket.on('battle.opponent_reconnected', mine(() => this.onStatus?.('Opponent is back.'))),
      socket.on('error', (m) => this.#pending && ['INVALID_SKILL', 'ALREADY_SUBMITTED', 'NOT_IN_BATTLE', 'BATTLE_OVER'].includes(m.code) && this.#fail(new Error(m.message))),
    ];
  }

  submitSkill(skillId) {
    return new Promise((resolve, reject) => {
      this.#pending = { resolve, reject };
      this.onStatus?.('Waiting for the opponent...');
      try {
        this.socket.send({ type: 'battle.action', battleId: this.id, skillId });
      } catch (err) {
        this.#fail(err);
      }
    });
  }

  forfeit() {
    this.socket.send({ type: 'battle.forfeit', battleId: this.id });
    return null; // the server answers with battle.end
  }

  #turn(m) {
    this.state = m.state;
    const result = { events: m.events, state: m.state, rewards: null };
    if (this.#pending) {
      this.#pending.resolve(result);
      this.#pending = null;
    } else {
      this.onUnsolicitedTurn?.(result);
    }
  }

  #end(m) {
    const err = new Error('Battle ended');
    err.name = 'SessionEnded';
    this.#fail(err);
    this.onForcedEnd?.({ winner: m.winner, reason: m.reason });
  }

  #fail(err) {
    this.#pending?.reject(err);
    this.#pending = null;
  }

  close() {
    this.#offs.forEach((off) => off());
  }
}
