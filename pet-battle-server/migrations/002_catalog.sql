-- Static game data (edited by designers via seeds, read-only for players).

CREATE TABLE skills (
  id       text PRIMARY KEY,
  name     text NOT NULL,
  element  text NOT NULL,
  category text NOT NULL CHECK (category IN ('physical', 'magic')),
  power    int  NOT NULL CHECK (power >= 0),
  accuracy int  NOT NULL CHECK (accuracy BETWEEN 1 AND 100),
  priority int  NOT NULL DEFAULT 0
);

CREATE TABLE species (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  elements    text[] NOT NULL,
  base_hp     int NOT NULL,
  base_atk    int NOT NULL,
  base_def    int NOT NULL,
  base_sp_atk int NOT NULL,
  base_sp_def int NOT NULL,
  base_speed  int NOT NULL,
  model_url   text,
  is_starter  boolean NOT NULL DEFAULT false
);

CREATE TABLE species_skills (
  species_id  text NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  skill_id    text NOT NULL REFERENCES skills(id)  ON DELETE CASCADE,
  learn_level int  NOT NULL DEFAULT 1,
  PRIMARY KEY (species_id, skill_id)
);

CREATE TABLE maps (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  min_level   int  NOT NULL DEFAULT 1,
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE TABLE map_encounters (
  id         serial PRIMARY KEY,
  map_id     text NOT NULL REFERENCES maps(id)    ON DELETE CASCADE,
  species_id text NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  weight     int  NOT NULL CHECK (weight > 0),
  min_level  int  NOT NULL CHECK (min_level >= 1),
  max_level  int  NOT NULL,
  CHECK (max_level >= min_level)
);
CREATE INDEX map_encounters_map_idx ON map_encounters(map_id);
