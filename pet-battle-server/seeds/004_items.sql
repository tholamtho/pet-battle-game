INSERT INTO items (id, name, description, type, rarity, slot, stats, effect, hatch_seconds, price) VALUES
  ('exp_candy_s',     'Small exp candy',  'Gives a pet 100 exp.',                'consumable', 'common', NULL,        '{}',                          '{"exp": 100}',          NULL, 50),
  ('exp_candy_m',     'Medium exp candy', 'Gives a pet 500 exp.',                'consumable', 'rare',   NULL,        '{}',                          '{"exp": 500}',          NULL, 200),
  ('incubator_boost', 'Incubator boost',  'Shortens an egg''s hatching by 5 minutes.', 'consumable', 'common', NULL,  '{}',                          '{"hatchSeconds": 300}', NULL, 100),
  ('evolution_stone', 'Evolution stone',  'Some pets need this to evolve.',      'material',   'rare',   NULL,        '{}',                          '{}',                    NULL, NULL),
  ('egg_common',      'Common egg',       'Hatches in 10 minutes.',              'egg',        'common', NULL,        '{}',                          '{}',                    600,  300),
  ('egg_fire',        'Ember egg',        'A warm egg. Hatches in 30 minutes.',  'egg',        'rare',   NULL,        '{}',                          '{}',                    1800, 600),
  ('leaf_hat',        'Leaf hat',         '+3 defense.',                         'equipment',  'common', 'head',      '{"def": 3}',                  '{}',                    NULL, 150),
  ('flame_scarf',     'Flame scarf',      '+4 attack, +2 special attack.',       'equipment',  'rare',   'body',      '{"atk": 4, "spAtk": 2}',      '{}',                    NULL, 400),
  ('swift_cape',      'Swift cape',       '+5 speed.',                           'equipment',  'rare',   'back',      '{"speed": 5}',                '{}',                    NULL, 400),
  ('lucky_charm',     'Lucky charm',      '+8 HP.',                              'equipment',  'common', 'accessory', '{"hp": 8}',                   '{}',                    NULL, 200)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, type = EXCLUDED.type,
  rarity = EXCLUDED.rarity, slot = EXCLUDED.slot, stats = EXCLUDED.stats, effect = EXCLUDED.effect,
  hatch_seconds = EXCLUDED.hatch_seconds, price = EXCLUDED.price;
