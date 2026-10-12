INSERT INTO skills (id, name, element, category, power, accuracy, priority, anim) VALUES
  ('inferno',     'Inferno',     'fire',  'magic', 110, 75, 0, 'special'),
  ('tsunami',     'Tsunami',     'water', 'magic', 110, 75, 0, 'special'),
  ('thorn_storm', 'Thorn storm', 'grass', 'magic', 110, 75, 0, 'special')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, element = EXCLUDED.element, category = EXCLUDED.category,
  power = EXCLUDED.power, accuracy = EXCLUDED.accuracy, priority = EXCLUDED.priority, anim = EXCLUDED.anim;

INSERT INTO species (id, name, elements, base_hp, base_atk, base_def, base_sp_atk, base_sp_def, base_speed, is_starter) VALUES
  ('blazard',  'Blazard',  '{fire}',   80,  85, 70, 100, 75, 85, false),
  ('tidalon',  'Tidalon',  '{water}', 100,  75, 95,  85, 95, 65, false),
  ('forestor', 'Forestor', '{grass}',  95,  80, 90,  95, 90, 70, false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, elements = EXCLUDED.elements, base_hp = EXCLUDED.base_hp,
  base_atk = EXCLUDED.base_atk, base_def = EXCLUDED.base_def, base_sp_atk = EXCLUDED.base_sp_atk,
  base_sp_def = EXCLUDED.base_sp_def, base_speed = EXCLUDED.base_speed;

INSERT INTO species_skills (species_id, skill_id, learn_level) VALUES
  ('blazard',  'tackle', 1), ('blazard',  'quick_strike', 1), ('blazard',  'ember',      1), ('blazard',  'flame_burst', 1), ('blazard',  'inferno',     16),
  ('tidalon',  'tackle', 1), ('tidalon',  'quick_strike', 1), ('tidalon',  'water_gun',  1), ('tidalon',  'tidal_crash', 1), ('tidalon',  'tsunami',     16),
  ('forestor', 'tackle', 1), ('forestor', 'quick_strike', 1), ('forestor', 'vine_whip',  1), ('forestor', 'solar_beam',  1), ('forestor', 'thorn_storm', 16)
ON CONFLICT (species_id, skill_id) DO UPDATE SET learn_level = EXCLUDED.learn_level;

-- Evolution rules: level (+ optional item). Edit freely.
UPDATE species SET evolves_to = 'blazard',  evolve_level = 16, evolve_item = NULL              WHERE id = 'flamey';
UPDATE species SET evolves_to = 'tidalon',  evolve_level = 16, evolve_item = 'evolution_stone' WHERE id = 'aquo';
UPDATE species SET evolves_to = 'forestor', evolve_level = 16, evolve_item = 'evolution_stone' WHERE id = 'leafy';
