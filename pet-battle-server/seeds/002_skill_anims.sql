-- Which skills play the pet's "special" animation. Everything else plays "attack".
-- Edit freely: no code change needed.
UPDATE skills SET anim = 'special' WHERE id IN ('flame_burst', 'tidal_crash', 'solar_beam');
