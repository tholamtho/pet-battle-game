/** Game data registry. Starts with the bundled JSON; replaced by the server's /catalog when online. */
import speciesJson from './species.json';
import skillsJson from './skills.json';
import typeChartJson from './typeChart.json';
import itemsJson from './items.json';

export function buildCatalog({ species, skills, typeChart, items = [] }) {
  const catalog = {
    species: new Map(species.map((s) => [s.id, s])),
    skills: new Map(skills.map((s) => [s.id, s])),
    typeChart,
    items: new Map(items.map((i) => [i.id, i])),
  };
  for (const sp of species) {
    for (const { skillId } of sp.skills) {
      if (!catalog.skills.has(skillId)) throw new Error(`Species "${sp.id}" references unknown skill "${skillId}"`);
    }
  }
  return catalog;
}

let catalog = buildCatalog({ species: speciesJson, skills: skillsJson, typeChart: typeChartJson, items: itemsJson });

export const useCatalog = (json) => {
  catalog = buildCatalog(json);
};
export const getCatalog = () => catalog;
export const listSpecies = () => [...catalog.species.values()];

export function getSpecies(id) {
  const s = catalog.species.get(id);
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}
export function getSkill(id) {
  const s = catalog.skills.get(id);
  if (!s) throw new Error(`Unknown skill: ${id}`);
  return s;
}

/** Unlike species/skills, unknown items return undefined (the server may know items this build doesn't). */
export const getItem = (id) => catalog.items.get(id);
export const listItems = () => [...catalog.items.values()];
