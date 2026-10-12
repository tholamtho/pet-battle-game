INSERT INTO skills (id, name, element, category, power, accuracy, priority) VALUES
  ('tackle',       'Tackle',       'normal', 'physical', 40, 100, 0),
  ('quick_strike', 'Quick strike', 'normal', 'physical', 30, 100, 1),
  ('ember',        'Ember',        'fire',   'magic',    55, 95,  0),
  ('flame_burst',  'Flame burst',  'fire',   'magic',    85, 80,  0),
  ('water_gun',    'Water gun',    'water',  'magic',    55, 95,  0),
  ('tidal_crash',  'Tidal crash',  'water',  'physical', 85, 80,  0),
  ('vine_whip',    'Vine whip',    'grass',  'physical', 55, 95,  0),
  ('solar_beam',   'Solar beam',   'grass',  'magic',    85, 80,  0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, element = EXCLUDED.element,
  category = EXCLUDED.category, power = EXCLUDED.power, accuracy = EXCLUDED.accuracy, priority = EXCLUDED.priority;

INSERT INTO species (id, name, elements, base_hp, base_atk, base_def, base_sp_atk, base_sp_def, base_speed, is_starter) VALUES
  ('flamey', 'Flamey', '{fire}',  60, 65, 50, 75, 55, 70, true),
  ('aquo',   'Aquo',   '{water}', 75, 55, 70, 65, 70, 50, true),
  ('leafy',  'Leafy',  '{grass}', 70, 60, 65, 70, 65, 55, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, elements = EXCLUDED.elements,
  base_hp = EXCLUDED.base_hp, base_atk = EXCLUDED.base_atk, base_def = EXCLUDED.base_def,
  base_sp_atk = EXCLUDED.base_sp_atk, base_sp_def = EXCLUDED.base_sp_def,
  base_speed = EXCLUDED.base_speed, is_starter = EXCLUDED.is_starter;

INSERT INTO species_skills (species_id, skill_id, learn_level) VALUES
  ('flamey', 'tackle', 1), ('flamey', 'quick_strike', 1), ('flamey', 'ember', 1), ('flamey', 'flame_burst', 10),
  ('aquo',   'tackle', 1), ('aquo',   'quick_strike', 1), ('aquo',   'water_gun', 1), ('aquo',   'tidal_crash', 10),
  ('leafy',  'tackle', 1), ('leafy',  'quick_strike', 1), ('leafy',  'vine_whip', 1), ('leafy',  'solar_beam', 10)
ON CONFLICT (species_id, skill_id) DO UPDATE SET learn_level = EXCLUDED.learn_level;

INSERT INTO maps (id, name, description, min_level, sort_order) VALUES
  ('meadow',     'Starter meadow', 'Calm fields. A good place to train.', 1, 1),
  ('ember_cave', 'Ember cave',     'Hot tunnels full of fire pets.',      5, 2),
  ('tide_shore', 'Tide shore',     'Waves, rocks and water pets.',        5, 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  min_level = EXCLUDED.min_level, sort_order = EXCLUDED.sort_order;

DELETE FROM map_encounters WHERE map_id IN ('meadow', 'ember_cave', 'tide_shore');
INSERT INTO map_encounters (map_id, species_id, weight, min_level, max_level) VALUES
  ('meadow',     'leafy',  50, 2, 5),
  ('meadow',     'aquo',   25, 2, 5),
  ('meadow',     'flamey', 25, 2, 5),
  ('ember_cave', 'flamey', 70, 5, 9),
  ('ember_cave', 'leafy',  30, 5, 9),
  ('tide_shore', 'aquo',   70, 5, 9),
  ('tide_shore', 'flamey', 30, 5, 9);
