-- Animation hint per skill: 'attack' (default) or 'special'. The client maps it to the pet's clips.
ALTER TABLE skills ADD COLUMN anim text NOT NULL DEFAULT 'attack';

-- Model files/config now live next to the client assets (public/pets/<species_id>/), not in the DB.
ALTER TABLE species DROP COLUMN model_url;

CREATE TABLE type_chart (
  attacker   text NOT NULL,
  defender   text NOT NULL,
  multiplier real NOT NULL CHECK (multiplier >= 0),
  PRIMARY KEY (attacker, defender)
);

CREATE TABLE battles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode        text NOT NULL CHECK (mode IN ('pve', 'pvp')),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'abandoned')),
  p1_user     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p2_user     uuid REFERENCES users(id) ON DELETE CASCADE,
  state       jsonb NOT NULL,
  winner      text CHECK (winner IN ('p1', 'p2')),
  end_reason  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX battles_p1_idx ON battles(p1_user, status);
CREATE INDEX battles_p2_idx ON battles(p2_user, status);
-- A player can only have one active PvE battle (resume it instead of starting another).
CREATE UNIQUE INDEX battles_one_active_pve ON battles(p1_user) WHERE mode = 'pve' AND status = 'active';
CREATE TRIGGER battles_set_updated_at BEFORE UPDATE ON battles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
