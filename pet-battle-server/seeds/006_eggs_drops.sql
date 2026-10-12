DELETE FROM egg_pools WHERE item_id IN ('egg_common', 'egg_fire');
INSERT INTO egg_pools (item_id, species_id, weight) VALUES
  ('egg_common', 'flamey', 34), ('egg_common', 'aquo', 33), ('egg_common', 'leafy', 33),
  ('egg_fire',   'flamey', 100);

DELETE FROM map_drops WHERE map_id IN ('meadow', 'ember_cave', 'tide_shore');
INSERT INTO map_drops (map_id, item_id, chance, min_qty, max_qty) VALUES
  ('meadow',     'exp_candy_s',     0.30, 1, 2),
  ('meadow',     'egg_common',      0.08, 1, 1),
  ('meadow',     'leaf_hat',        0.05, 1, 1),
  ('ember_cave', 'exp_candy_m',     0.10, 1, 1),
  ('ember_cave', 'evolution_stone', 0.05, 1, 1),
  ('ember_cave', 'flame_scarf',     0.05, 1, 1),
  ('ember_cave', 'egg_fire',        0.05, 1, 1),
  ('tide_shore', 'exp_candy_s',     0.30, 1, 2),
  ('tide_shore', 'egg_common',      0.06, 1, 1),
  ('tide_shore', 'swift_cape',      0.05, 1, 1),
  ('tide_shore', 'lucky_charm',     0.05, 1, 1);
