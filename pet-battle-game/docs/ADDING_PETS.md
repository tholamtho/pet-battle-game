# Adding a pet's 3D model and animations (no code changes)

Everything is picked up by convention. You never edit JavaScript.

## 1. Put the files in place

```
public/pets/<speciesId>/model.glb     the model with its animations baked in
public/pets/<speciesId>/config.json   can be just {}
```

`<speciesId>` is the species `id` from the catalog (e.g. `flamey`). No folder, or no `config.json` => the pet
uses the built-in placeholder, so you can add art one pet at a time.

## 2. Name your clips (the zero-config path)

Export these clip names from Blender/Mixamo and nothing else is needed. Matching ignores case, spaces and
prefixes like `Armature|`.

| State     | Plays when                      | Recognised names                                |
| --------- | ------------------------------- | ----------------------------------------------- |
| `idle`    | standing, looping               | idle, stand, wait, breathe                      |
| `attack`  | using a normal skill            | attack, attack1, atk, strike                    |
| `special` | using a skill marked `special`  | special, skill, attack2, cast, ultimate         |
| `hit`     | being hit                       | hit, hurt, damage, damaged, gethit, hitreact    |
| `faint`   | HP reaches 0 (holds last frame) | faint, die, death, dead, ko                     |

Every state is optional. A missing one falls back to a procedural motion (lunge, shake, topple, a jump-spin
for special). A `special` skill with no `special` clip plays the `attack` clip.

## 3. config.json (all fields optional)

See `public/pets/_example/config.json`.

| Field             | Meaning                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `model`           | glb file name in the pet's folder (default `model.glb`)                                       |
| `scale`, `yOffset`| size and vertical offset                                                                      |
| `rotationY`       | radians. Use `3.14159` if the model faces away from the camera                                |
| `animations`      | map a state to a clip name when your names don't follow the convention                        |
| `skillAnimations` | per-skill override: `"skill_id": "ClipName"` or `"attack"` / `"special"`                      |
| `timing`          | seconds into the clip when the hit lands: `attackImpact`, `specialImpact` (default 45% of clip) |
| `lunge`           | `true` to also slide toward the target during clips that have no root motion                  |
| `sockets`         | where equipment attaches (bone + offset per slot). See `docs/ADDING_ITEMS.md`                 |

`timing` matters: the target's hit reaction, the particle burst and the HP bar drop all fire at that moment.

## 4. Which skills are "special"?

It is data, not code. In the database: `UPDATE skills SET anim = 'special' WHERE id = '...'` (see
`seeds/002_skill_anims.sql` in the server), or the `anim` field in `src/data/skills.json` for offline mode.
A single pet can still give one skill its own clip via `skillAnimations`.

## 5. Check it: the model viewer

`npm run dev`, then open **/viewer.html**. Pick the species (or drop a `.glb` and `config.json` onto the page
to test before copying files). It lists every clip in the file, shows which clip each state resolved to,
and has buttons to play each state and each skill, with the hit particles.

## 6. A brand-new species (not just art)

Stats and skills are data too. Add rows to `species`, `species_skills` (and `skills` if needed) in the server
(`seeds/001_catalog.sql`), re-run `npm run seed` and restart the server. The client downloads the catalog on
start (`GET /catalog`), so no client change is needed. For offline practice mode also add it to `src/data/species.json`.

## Tips

- Compress before shipping: `npx gltf-transform optimize in.glb model.glb --compress draco --texture-compress webp`
- Keep clips short: attack 0.5 to 1 s. Long clips make turns feel slow.
- Draco and Meshopt compressed files both load.
