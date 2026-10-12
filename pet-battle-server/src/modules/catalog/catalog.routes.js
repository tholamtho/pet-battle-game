import { Router } from 'express';
import { catalogToJson } from './catalog.service.js';

const router = Router();

/** Everything the client needs to run the game rules and animations. Public, cacheable. */
router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json(catalogToJson());
});

export default router;
