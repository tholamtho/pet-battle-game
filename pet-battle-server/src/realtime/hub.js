/** Registry of authenticated connections. One live connection per user: a new login replaces the old one. */
export class Hub {
  #conns = new Map();

  register(userId, conn) {
    const old = this.#conns.get(userId);
    this.#conns.set(userId, conn);
    if (old && old !== conn) {
      old.send({ type: 'error', code: 'REPLACED', message: 'Signed in from another place' });
      old.close(4001, 'replaced');
    }
  }

  unregister(userId, conn) {
    if (this.#conns.get(userId) === conn) this.#conns.delete(userId);
  }

  get(userId) {
    return this.#conns.get(userId);
  }

  isActive(userId, conn) {
    return this.#conns.get(userId) === conn;
  }

  send(userId, message) {
    this.#conns.get(userId)?.send(message);
  }
}
