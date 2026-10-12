-- ---------- items ----------
CREATE TABLE items (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  type          text NOT NULL CHECK (type IN ('consumable', 'equipment', 'egg', 'material')),
  rarity        text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  slot          text CHECK (slot IN ('head', 'body', 'back', 'accessory')),
  stats         jsonb NOT NULL DEFAULT '{}',   -- equipment: flat bonuses, e.g. {"atk": 4, "speed": 2}
  effect        jsonb NOT NULL DEFAULT '{}',   -- consumable: {"exp": 100} (pet) or {"hatchSeconds": 300} (egg)
  hatch_seconds int,                           -- eggs only
  price         int CHECK (price >= 0),        -- NULL = not sold in the shop
  CHECK ((type = 'equipment') = (slot IS NOT NULL)),
  CHECK ((type = 'egg') = (hatch_seconds IS NOT NULL))
);

CREATE TABLE inventory (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id  text NOT NULL REFERENCES items(id),
  quantity int  NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE pet_equipment (
  pet_id  uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  slot    text NOT NULL CHECK (slot IN ('head', 'body', 'back', 'accessory')),
  item_id text NOT NULL REFERENCES items(id),
  PRIMARY KEY (pet_id, slot)
);

-- ---------- eggs ----------
CREATE TABLE egg_pools (
  item_id    text NOT NULL REFERENCES items(id)   ON DELETE CASCADE,
  species_id text NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  weight     int  NOT NULL CHECK (weight > 0),
  PRIMARY KEY (item_id, species_id)
);

CREATE TABLE eggs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    text NOT NULL REFERENCES items(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  hatch_at   timestamptz NOT NULL
);
CREATE INDEX eggs_owner_idx ON eggs(owner_id);

ALTER TABLE players ADD COLUMN incubator_slots int NOT NULL DEFAULT 2 CHECK (incubator_slots BETWEEN 1 AND 10);

-- ---------- evolution ----------
ALTER TABLE species
  ADD COLUMN evolves_to   text REFERENCES species(id),
  ADD COLUMN evolve_level int,
  ADD COLUMN evolve_item  text REFERENCES items(id),
  ADD CONSTRAINT evolution_complete CHECK ((evolves_to IS NULL) = (evolve_level IS NULL));

-- ---------- drops ----------
CREATE TABLE map_drops (
  id       serial PRIMARY KEY,
  map_id   text NOT NULL REFERENCES maps(id)  ON DELETE CASCADE,
  item_id  text NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  chance   real NOT NULL CHECK (chance > 0 AND chance <= 1),
  min_qty  int NOT NULL DEFAULT 1 CHECK (min_qty >= 1),
  max_qty  int NOT NULL DEFAULT 1,
  CHECK (max_qty >= min_qty)
);
CREATE INDEX map_drops_map_idx ON map_drops(map_id);
