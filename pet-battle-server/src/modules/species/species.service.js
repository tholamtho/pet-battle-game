import { notFound } from '../../common/errors.js';
import * as repo from './species.repo.js';

export const list = () => repo.list();

export async function get(id) {
  const species = await repo.findById(id);
  if (!species) throw notFound('Species');
  return { ...species, skills: await repo.skillsFor(id) };
}
