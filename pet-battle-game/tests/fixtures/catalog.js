export function testCatalog() {
  const skill = (id, power, priority = 0, element = 'normal', accuracy = 100) => ({
    id, name: id, element, category: 'physical', power, accuracy, priority, anim: 'attack',
  });
  const base = { hp: 60, atk: 60, def: 50, spAtk: 60, spDef: 50 };
  const sp = (id, elements, speed) => ({
    id, name: id, elements, baseStats: { ...base, speed }, isStarter: true,
    skills: [{ skillId: 'tackle', learnLevel: 1 }, { skillId: 'quick', learnLevel: 1 }, { skillId: 'big', learnLevel: 1 }],
  });
  return {
    skills: new Map([skill('tackle', 40), skill('quick', 30, 1), skill('big', 90)].map((s) => [s.id, s])),
    species: new Map([sp('fast', ['fire'], 90), sp('slow', ['grass'], 20)].map((s) => [s.id, s])),
    typeChart: { fire: { grass: 2 } },
    items: new Map([
      ['hat', { id: 'hat', type: 'equipment', slot: 'head', stats: { def: 3, speed: 2 } }],
      ['ring', { id: 'ring', type: 'equipment', slot: 'accessory', stats: { hp: 8 } }],
    ]),
  };
}
