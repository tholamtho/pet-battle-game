-- Per-player state.

CREATE TABLE players (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level          int  NOT NULL DEFAULT 1 CHECK (level >= 1),
  exp            int  NOT NULL DEFAULT 0 CHECK (exp >= 0),
  gold           int  NOT NULL DEFAULT 0 CHECK (gold >= 0),
  current_map_id text REFERENCES maps(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER players_set_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE pets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id text NOT NULL REFERENCES species(id),
  nickname   varchar(20),
  level      int NOT NULL DEFAULT 5 CHECK (level BETWEEN 1 AND 100),
  exp        int NOT NULL DEFAULT 0 CHECK (exp >= 0),
  team_slot  smallint CHECK (team_slot BETWEEN 1 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pets_owner_idx ON pets(owner_id);
-- A player can have at most one pet per team slot.
CREATE UNIQUE INDEX pets_team_slot_uq ON pets(owner_id, team_slot) WHERE team_slot IS NOT NULL;
CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
