# Pet Battle Server (Node.js + Express + PostgreSQL + WebSocket)

REST API + realtime battle server. ESM, Node >= 20. Migrations, seeds, the REST API and the WebSocket PvP flow
were exercised end to end against PostgreSQL 16 (PvE with rewards, two-client PvP, forfeit, disconnect/reconnect).

## Quick start

```bash
cp .env.example .env            # set JWT_SECRET
docker compose up -d db         # Postgres 16 on :5432 (or your own, edit DATABASE_URL)
npm install
npm run db:setup                # migrate + seed
npm run dev                     # REST http://localhost:3000/api/v1  WebSocket ws://localhost:3000/ws
npm test
```

Everything in Docker: `docker compose up --build` (runs migrations on start). REST and WebSocket share one port.
Static data (species, skills, maps, type chart) is loaded into memory at boot: **restart after `npm run seed`**.

## Structure

```
migrations/            forward-only SQL (001 init ... 004 battles, 005 items/eggs/evolution)
seeds/                 idempotent static data: species, skills, maps, type chart, items, evolutions, egg pools, drops
scripts/               migrate.js, seed.js
src/
  server.js            boot: load catalog -> HTTP -> WebSocket, graceful shutdown
  app.js               express app (middleware, health, /api/v1)
  config/ db/ common/ middleware/
  modules/
    auth/ players/ species/ pets/ maps/
    inventory/ equipment/ eggs/ shop/   bag + exp candy, gear on pets, incubation, gold shop
    catalog/           loads static data into memory, serves GET /catalog
    battle/
      engine/          PURE rules (no DB, no HTTP). Same code lives in the client (src/engine)
      progression.js   exp, level-ups, rewards
      battles.*        wild (PvE) battles over REST, persisted in `battles`
    _template/         copy to start a new module
  realtime/            WebSocket PvP: protocol, hub, matchmaker, rooms, handlers
tests/
```

Layering inside a module: `routes -> service -> repo -> PostgreSQL` (routes never touch SQL, repos never throw HTTP
errors). The battle **engine** is pure and takes the catalog as an argument, so the same file runs on the server
(authoritative) and in the client (offline practice). It is duplicated on purpose; extract it into a shared
package when you move to a monorepo.

## Battles

Server-authoritative: clients only send "use skill X"; the server validates, resolves, and returns **events**
(`attack`, `miss`, `faint`, `end`) that the client animates. Randomness is seeded per battle and never sent to
clients, so outcomes can't be predicted or forged. Sides are `p1` / `p2`; each message tells the client which one it is (`you`).

### Wild battles (REST)

1. `POST /maps/:id/enter`, then `POST /battles/pve` `{ petId? }` (defaults to team slot 1). Returns the battle in progress if one exists, so a page reload resumes it.
2. `POST /battles/:id/turn` `{ skillId }` -> `{ events, state, rewards }`. The wild pet's move is chosen by the server AI.
3. On a win the same transaction grants exp/gold, applies level-ups and rolls **item drops** from the map's `map_drops` (`rewards.drops`). `POST /battles/:id/forfeit` to leave.

**Equipment in battle:** worn items add flat stat bonuses (`items.stats`) when the combatant is created, for PvE and PvP. The `equipment` list stays in the public battle state so clients can show both fighters' gear. Changing equipment mid-battle does not affect a battle already started.

### PvP (WebSocket `/ws`)

JSON messages. The first message must be `{ "type": "auth", "token": "<JWT>" }` (5 s timeout; token is not in the URL).

| Client -> server | Notes |
| --- | --- |
| `auth {token}` | answered with `auth.ok`; also resumes a battle in progress |
| `queue.join {petId?}` / `queue.leave` | FIFO matchmaking |
| `battle.action {battleId, skillId}` | once per turn |
| `battle.forfeit {battleId}` | |
| `ping` | answered with `pong` |

| Server -> client | Notes |
| --- | --- |
| `queue.joined`, `queue.left` | |
| `battle.start {battleId, you, state}` | match found |
| `battle.action.ack`, `battle.opponent_ready` | your choice was accepted / opponent chose |
| `battle.turn {battleId, events, state}` | sent to both once both chose. The final KO events arrive here |
| `battle.end {battleId, winner, reason}` | forfeit or disconnect only |
| `battle.opponent_disconnected {graceMs}`, `battle.opponent_reconnected` | |
| `battle.resume {battleId, you, state, turn, submitted}` | after reconnecting |
| `error {code, message}` | `UNAUTHORIZED`, `REPLACED`, `INVALID_SKILL`, `ALREADY_SUBMITTED`, `NOT_IN_BATTLE`, ... |

Rules: 30 s per turn (a random skill is chosen for whoever didn't pick), 20 s to reconnect before a disconnect
counts as a forfeit, one live connection per user (a new login replaces the old one), 60 messages / 10 s per
connection. Both limits are `RoomManager` options.

## REST API (`/api/v1`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | - | `{ username, password }` -> `{ token, user }` |
| GET | `/catalog` | - | species (with skills), skills (with `anim`), type chart. Cacheable |
| GET | `/players/me` | yes | level, exp, gold, current map, pet count |
| POST | `/players/starter` | yes | `{ speciesId }`, once, starter species only |
| GET | `/species`, `/species/:id` | - | |
| GET/PATCH/DELETE | `/pets`, `/pets/:id` | yes | list, rename, release (never the last pet) |
| PUT | `/pets/team` | yes | `{ petIds }` max 6 |
| GET | `/maps`, `/maps/:id` | yes | `unlocked` by player level |
| POST | `/maps/:id/enter`, `/maps/:id/encounter` | yes | enter checks level |
| GET | `/battles/active` | yes | wild battle in progress or `null` |
| POST | `/battles/pve`, `/battles/:id/turn`, `/battles/:id/forfeit` | yes | see above |
| GET | `/battles/:id` | yes | participant only |
| GET | `/inventory` | yes | `[{ itemId, quantity }]` |
| POST | `/inventory/use` | yes | `{ itemId, petId, quantity? }` exp candy: adds exp, applies level-ups |
| PUT/DELETE | `/pets/:id/equipment/:slot` | yes | `{ itemId }`. Moves one copy bag <-> pet (slot: head/body/back/accessory) |
| POST | `/pets/:id/evolve` | yes | level + optional item (consumed); keeps level/exp/nickname/equipment |
| GET | `/eggs` | yes | `{ slots, eggs: [{ id, itemId, remainingSeconds }] }` (DB clock) |
| POST | `/eggs/incubate` | yes | `{ itemId }`, needs a free incubator |
| POST | `/eggs/:id/speedup`, `/eggs/:id/hatch` | yes | `{ itemId }` boost / hatch when ready (species rolled now from the egg's pool) |
| GET | `/shop` | yes | `[{ itemId, price }]` |
| POST | `/shop/buy` | yes | `{ itemId, quantity? }`, atomic gold spend |
| GET | `/health`, `/health/ready` | - | liveness / DB |

Errors: `{ "error": { "code", "message", "details" } }`. Send `Authorization: Bearer <token>`.

## Data-driven content (no code changes)

- Species, skills, learn levels, maps, encounter tables, **items, shop prices, evolution rules, egg pools, drops**: `seeds/*.sql`, then `npm run seed` and restart. New players get a small starter kit (egg, candy, boost): `STARTER_KIT` in `players.service.js`.
- Which skills use the **special** animation: `skills.anim` (`seeds/002_skill_anims.sql`).
- 3D models, per-pet animation clips and equipment models are **not** stored here: they live with the client assets in
  `public/pets/<speciesId>/` and `public/items/<itemId>/` (see the client's `docs/ADDING_PETS.md` and `docs/ADDING_ITEMS.md`).
- Balance knobs: `modules/battle/progression.js` (exp/gold/levels), `engine/damage.js`, `realtime/rooms.js` (timers).

## Add a feature (e.g. inventory)

1. `migrations/005_inventory.sql`
2. Copy `src/modules/_template` to `src/modules/inventory`, implement, mount in `src/modules/index.js`.

## Deploy

- Database: Neon, Supabase, Render Postgres, Railway... set `DATABASE_SSL=true`.
- API: Render, Railway, Fly.io (Dockerfile) or any Node host with WebSocket support. Required env: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`. Use `wss://` from HTTPS pages.
- **PvP rooms live in this process's memory.** Run one instance, or add sticky sessions plus Redis pub/sub before scaling out. On restart, unfinished PvP battles are marked `abandoned`. Wild battles live in the DB and survive restarts.

## Known gaps (on purpose)

- 1v1 only (team switching, battle items, status effects, capture are not implemented). Equipment is one stackable copy per item: no upgrade levels, durability, trading or per-instance stats yet. The engine state and `battle.action` message are shaped so extra action types can be added.
- Eggs are time-based only (no steps/walking), 3D egg models and a hatch cutscene are not included (the client shows a timer and a message).
- Matchmaking is plain FIFO (no rating/level buckets), PvP awards no rewards/rating yet.
- One access token (7 d), no refresh/revocation. No DB-backed integration tests committed (the flows were verified manually against Postgres).
- The engine is duplicated in the client; keep both copies in sync (both have the same test suite).
