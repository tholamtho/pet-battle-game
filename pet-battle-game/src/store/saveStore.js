import { SAVE_VERSION } from '@/config/constants.js';
import { logger } from '@/utils/logger.js';

const KEY = 'pet-battle:save';

const defaults = () => ({ version: SAVE_VERSION, wins: 0, losses: 0 });

/** Local persistence. Every storage access is guarded: it can throw (private mode, quota). */
export const saveStore = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const data = JSON.parse(raw);
      return data.version === SAVE_VERSION ? { ...defaults(), ...data } : defaults(); // add migrations here
    } catch (err) {
      logger.warn('Could not read save', err);
      return defaults();
    }
  },

  update(mutator) {
    const next = mutator(this.load()) ?? this.load();
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (err) {
      logger.warn('Could not write save', err);
    }
    return next;
  },
};
