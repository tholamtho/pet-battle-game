import { EventBus } from '@/core/EventBus.js';
import { logger } from '@/utils/logger.js';

/**
 * WebSocket client for PvP. Authenticates with a first message (the token never goes in the URL),
 * reconnects with backoff, and re-authenticates, which makes the server resume a battle in progress.
 * Server message types become events: socket.on('battle.turn', handler).
 */
export class BattleSocket {
  #bus = new EventBus();
  #ws = null;
  #retry = 0;
  #closed = false;
  #timer = null;

  constructor(url, getToken) {
    this.url = url;
    this.getToken = getToken;
  }

  get ready() {
    return this.#ws?.readyState === WebSocket.OPEN && this.authed;
  }

  /** Resolves after the first successful auth; later reconnects are automatic. */
  connect() {
    this.#closed = false;
    return new Promise((resolve, reject) => {
      const off = this.on('auth.ok', () => (off(), offErr(), resolve()));
      const offErr = this.on('error', (m) => m.code === 'UNAUTHORIZED' && (off(), offErr(), reject(new Error(m.message))));
      this.#open();
    });
  }

  #open() {
    this.authed = false;
    const ws = new WebSocket(this.url);
    this.#ws = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token: this.getToken() }));
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === 'auth.ok') {
        this.authed = true;
        this.#retry = 0;
      }
      if (msg.type === 'error' && (msg.code === 'UNAUTHORIZED' || msg.code === 'REPLACED')) this.#closed = true; // don't fight the server
      this.#bus.emit(msg.type, msg);
    };
    ws.onclose = () => {
      this.authed = false;
      this.#bus.emit('close');
      if (this.#closed) return;
      const delay = Math.min(1000 * 2 ** this.#retry++, 8000);
      logger.info(`socket closed, reconnecting in ${delay}ms`);
      this.#timer = setTimeout(() => this.#open(), delay);
    };
  }

  on(type, fn) {
    return this.#bus.on(type, fn);
  }

  send(msg) {
    if (this.#ws?.readyState !== WebSocket.OPEN) throw new Error('Not connected to the battle server');
    this.#ws.send(JSON.stringify(msg));
  }

  close() {
    this.#closed = true;
    clearTimeout(this.#timer);
    this.#ws?.close();
  }
}
