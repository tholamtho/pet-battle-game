import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './pets.schema.js';
import * as service from './pets.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.user.id))));
router.put('/team', validate(schema.setTeam), asyncHandler(async (req, res) => res.json(await service.setTeam(req.user.id, req.body.petIds))));
router.get('/:id', validate(schema.getPet), asyncHandler(async (req, res) => res.json(await service.get(req.user.id, req.params.id))));
router.patch('/:id', validate(schema.renamePet), asyncHandler(async (req, res) => res.json(await service.rename(req.user.id, req.params.id, req.body.nickname))));
router.post('/:id/evolve', validate(schema.evolvePet), asyncHandler(async (req, res) => res.json(await service.evolve(req.user.id, req.params.id))));
router.delete('/:id', validate(schema.releasePet), asyncHandler(async (req, res) => {
  await service.release(req.user.id, req.params.id);
  res.status(204).end();
}));

export default router;
