import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';
import * as battlesRepo from '../modules/battle/battles.repo.js';
import { clientMessage } from './protocol.js';
import { Hub } from './hub.js';
import { Matchmaker } from './matchmaker.js';
import { RoomManager } from './rooms.js';
import { createHandlers, createMatchHandler, toErrorMessage } from './handlers.js';

const AUTH_TIMEOUT_MS = 5_000;
const HEARTBEAT_MS = 30_000;
const MAX_MSGS_PER_10S = 60;

export function attachRealtime(server) {
  const hub = new Hub();
  const rooms = new RoomManager({ hub, repo: battlesRepo, logger });
  const matchmaker = new Matchmaker((a, b) => onMatch(a, b));
  const onMatch = createMatchHandler({ hub, matchmaker, rooms, logger });
  const handlers = createHandlers({ hub, matchmaker, rooms });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    const conn = {
      ws,
      userId: null,
      send: (msg) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(msg)),
      close: (code, reason) => ws.close(code, reason),
    };
    ws.isAlive = true;
    ws.on('pong', () => (ws.isAlive = true));

    const authTimer = setTimeout(() => conn.userId || ws.close(4000, 'auth timeout'), AUTH_TIMEOUT_MS);
    let windowStart = Date.now();
    let count = 0;

    ws.on('message', async (raw) => {
      if (Date.now() - windowStart > 10_000) [windowStart, count] = [Date.now(), 0];
      if (++count > MAX_MSGS_PER_10S) return ws.close(1008, 'rate limit');

      try {
        const msg = clientMessage.parse(JSON.parse(raw.toString()));
        if (msg.type === 'auth') {
          const payload = jwt.verify(msg.token, env.JWT_SECRET);
          conn.userId = payload.sub;
          clearTimeout(authTimer);
          hub.register(conn.userId, conn);
          conn.send({ type: 'auth.ok', user: { id: payload.sub, username: payload.username } });
          rooms.onReconnect(conn.userId); // resumes a battle in progress, if any
          return;
        }
        await handlers[msg.type](conn, msg);
      } catch (err) {
        if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
          conn.send({ type: 'error', code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
          return ws.close(4003, 'unauthorized');
        }
        if (err instanceof SyntaxError || err?.name === 'ZodError') {
          return conn.send({ type: 'error', code: 'BAD_MESSAGE', message: 'Malformed message' });
        }
        if (!(err?.code && typeof err.code === 'string')) logger.error({ err }, 'ws handler failed');
        conn.send(toErrorMessage(err));
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimer);
      // A replaced connection must not tear down the user's new session.
      if (!conn.userId || !hub.isActive(conn.userId, conn)) return;
      hub.unregister(conn.userId, conn);
      matchmaker.leave(conn.userId);
      rooms.onDisconnect(conn.userId);
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();

  return {
    close() {
      clearInterval(heartbeat);
      wss.clients.forEach((c) => c.close(1001, 'server shutting down'));
      wss.close();
    },
  };
}
