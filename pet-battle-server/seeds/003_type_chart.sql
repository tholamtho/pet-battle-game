INSERT INTO type_chart (attacker, defender, multiplier) VALUES
  ('fire',  'grass', 2),   ('fire',  'water', 0.5), ('fire',  'fire',  0.5),
  ('water', 'fire',  2),   ('water', 'grass', 0.5), ('water', 'water', 0.5),
  ('grass', 'water', 2),   ('grass', 'fire',  0.5), ('grass', 'grass', 0.5)
ON CONFLICT (attacker, defender) DO UPDATE SET multiplier = EXCLUDED.multiplier;
