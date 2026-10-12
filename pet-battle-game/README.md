# Pet Battle (Vite + Three.js)

Turn-based 3D pet battles. Works offline (practice mode) or against `pet-battle-server` (login, wild battles, PvP).

```bash
cp .env.example .env     # optional: VITE_API_URL=http://localhost:3000/api/v1 for online play
npm install
npm run dev              # game: http://localhost:5173   model viewer: /viewer.html
npm test
npm run build            # dist/
```

## Animations per pet (no code changes)

Drop `public/pets/<speciesId>/model.glb` + `config.json`. Clips named `idle`, `attack`, `hit`, `special`, `faint`
are picked up automatically; anything else is mapped in `config.json`. Missing states fall back to procedural
motion. **Full guide: `docs/ADDING_PETS.md`.** Check results in `/viewer.html` (also accepts a dropped .glb).

## Items, equipment, eggs, evolution

Bag, exp candy, 3D equipment worn by both fighters in battle, egg incubation, evolution and a gold shop
(Hub screen: menu -> "Pets, bag, eggs & shop"). Models are data too: `public/items/<id>/` and `sockets` in the
pet's config. **Guide: `docs/ADDING_ITEMS.md`.** Test attachments in `/viewer.html`.

## Structure

```
src/
  main.js
  config/          env (API + WS urls), constants
  core/            EventBus, Loop
  engine/          PURE battle rules, identical to the server's (offline practice uses it)
  data/            bundled catalog (offline) + registry; replaced by GET /catalog when online
  render/          three.js only
    animation/     config.js (states, clip aliases, defaults), resolveClip.js (pure, tested)
    PetModel.js    plays a pet's own clips, procedural fallback per state, impact callback
    PetFactory.js  public/pets/<id>/ convention -> model, or placeholder
    EquipmentFactory.js  public/items/<id>/ convention -> equipment object, or placeholder
    animation/sockets.js where each slot attaches on a pet (pure, tested)
    BattleScene.js stage + events -> animation (hit reaction / VFX / HP fire at the impact moment)
  game/
    Game.js        screen flow: login -> menu -> battle -> menu
    BattleController.js   plays ANY session on stage + HUD
    sessions/      LocalSession (offline) | PveSession (REST) | PvpSession (WebSocket): same interface
    perspective.js engine p1/p2  ->  scene player/enemy
  api/             httpClient + auth/catalog/players/pets/maps/battles/inventory/eggs/shop
  net/             BattleSocket (auth handshake, reconnect + resume)
  store/           authStore (token), saveStore
  ui/              HUD components + screens (auth, menu, queue, hub: pets/bag/eggs/shop)
  viewer/          model viewer for artists
```

Dependency rule: `engine` imports nothing from `render`/`ui`/`api`. Sessions are the only place that knows
whether a battle is offline, REST or WebSocket, so the controller, scene and HUD are identical for all modes.

## Online flow

1. `GET /catalog` replaces the bundled data (skills carry `anim`, species carry skills).
2. Login/register (token in localStorage, `401` returns to login), then a WebSocket connects and authenticates.
3. Wild battle: enter map, start PvE, one request per turn. A reload resumes the battle (`/battles/active`).
4. PvP: queue over the socket, `battle.start`, choose, `battle.turn` for both. Dropping the connection for less
   than 20 s resumes the same battle.

## Deploy

Cloudflare Pages / Vercel / Netlify: build `npm run build`, output `dist`, env `VITE_API_URL=https://your-api/api/v1`.
GitHub Pages under a sub-path: set `base: '/repo-name/'` in `vite.config.js`. Server `CORS_ORIGIN` must include the site origin.

## Not verified

Built and unit-tested, and the network layer (REST, sockets, sessions) was run against the real server, but the
3D scene and UI screens were not opened in a browser in this environment. Run it once and check the first battle.
