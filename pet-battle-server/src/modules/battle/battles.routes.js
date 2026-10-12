import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './battles.schema.js';
import * as service from './battles.service.js';

const router = Router();
router.use(requireAuth);

router.get('/active', asyncHandler(async (req, res) => res.json(await service.getActive(req.user.id))));
router.post('/pve', validate(schema.startPve), asyncHandler(async (req, res) => res.status(201).json(await service.startPve(req.user.id, req.body))));
router.get('/:id', validate(schema.getBattle), asyncHandler(async (req, res) => res.json(await service.get(req.user.id, req.params.id))));
router.post('/:id/turn', validate(schema.turn), asyncHandler(async (req, res) => res.json(await service.submitTurn(req.user.id, req.params.id, req.body.skillId))));
router.post('/:id/forfeit', validate(schema.forfeit), asyncHandler(async (req, res) => res.json(await service.forfeit(req.user.id, req.params.id))));

export default router;
