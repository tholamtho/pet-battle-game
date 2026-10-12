# Items, equipment (3D), eggs and evolution

Game rules and numbers live in the **server's** seed files. Models live in the **client's** `public/` folders.
Neither needs code changes.

## 1. Equipment: 3D model on the pet

```
public/items/<itemId>/model.glb
public/items/<itemId>/config.json      { "model", "scale", "offset", "rotation" }   (all optional)
```

No folder => a simple placeholder shape for the slot (cone hat, ring, cape panel, gem), tinted by rarity.
Slots: `head`, `body`, `back`, `accessory`. The slot comes from the item's row in the server (`items.slot`).

Model a hat **at the origin, sitting on y = 0**, scaled for a pet about 2 units tall. Then fine tune with the item's
`config.json`: `scale`, `offset` `[x,y,z]`, `rotation` `[x,y,z]` in radians.

### Where it attaches: sockets (per species)

Each pet decides where its slots are, in its own `public/pets/<speciesId>/config.json`:

```json
"sockets": {
  "head":      { "bone": "Head",  "offset": [0, 0.12, 0.05], "rotation": [0, 0, 0], "scale": 1 },
  "back":      { "bone": "Spine", "offset": [0, 0, -0.2] },
  "accessory": { "offset": [0.5, 1.0, 0.3] }
}
```

- **With `bone`**: the item is parented to that bone, so it follows the animation (a hat nods with the head).
  `offset` is in the bone's local space, so units depend on how the rig was exported (centimetres vs metres).
  Start with `[0,0,0]` and adjust in the viewer. A wrong bone name logs a warning and falls back to the pet root.
- **Without `bone`**: a fixed point relative to the pet's feet. Defaults exist for every slot, so a pet with no
  `sockets` at all still wears gear (roughly in the right place).
- The pet's `scale`, plus the item's `scale`, are multiplied. Large or small pets can resize one hat model via `sockets.head.scale`.

Equipment is shown on **both** fighters in every battle, including the opponent in PvP.

### Test it: `/viewer.html`

Run `npm run dev`, open `/viewer.html`, pick the pet, then use the **Equipment** buttons. Adjust `config.json`, reload.
Drop a `.glb` + `config.json` on the page to test a pet model before copying it in.

## 2. Add or change items (server)

Edit `seeds/004_items.sql` in the server, run `npm run seed`, restart. Clients get the new catalog on start.

| type         | needs               | notes                                                                    |
| ------------ | ------------------- | ------------------------------------------------------------------------ |
| `consumable` | `effect`            | `{"exp": 100}` raises a pet's exp; `{"hatchSeconds": 300}` speeds up an egg |
| `equipment`  | `slot`, `stats`     | flat bonuses: `{"atk":4,"spAtk":2,"def":0,"spDef":0,"speed":5,"hp":8}`. Applied in battle by the server |
| `egg`        | `hatch_seconds`     | what it hatches into: `egg_pools` (seeds/006)                            |
| `material`   | nothing             | e.g. evolution stones                                                    |

`price` = sold in the shop (gold). `NULL` = drop-only. Rarity only affects the colour for now.

```sql
-- a new hat (then add public/items/crown/model.glb)
INSERT INTO items (id, name, description, type, rarity, slot, stats, price)
VALUES ('crown', 'Crown', '+6 defense', 'equipment', 'epic', 'head', '{"def":6}', 900);
```

## 3. Eggs

Egg item (`type = 'egg'`, `hatch_seconds`) + a hatch pool:

```sql
INSERT INTO egg_pools (item_id, species_id, weight) VALUES ('egg_rare', 'blazard', 10), ('egg_rare', 'flamey', 90);
```

The species is rolled **when the egg hatches**, on the server. Players start with 2 incubators
(`players.incubator_slots`, up to 10). Time uses the database clock, so changing the device clock does nothing.

## 4. Evolution

Columns on `species`: `evolves_to`, `evolve_level`, optional `evolve_item` (consumed). See `seeds/005_evolutions.sql`.
The evolved pet keeps its level, exp, nickname and equipment, and **its model switches automatically** because the
model folder is named after the species id: add `public/pets/<newSpeciesId>/`.

## 5. Drops

`map_drops` (seeds/006): per map, an item, a chance (0 to 1] and a quantity range, rolled on each wild-battle win.
Rewards also carry exp and gold.

## Checklist for a new equipment piece

1. Row in `items` (seed) + `npm run seed` + restart server
2. `public/items/<id>/model.glb` (+ `config.json`)
3. Optional: `sockets` entries in the pets that need a custom position
4. Check in `/viewer.html`
