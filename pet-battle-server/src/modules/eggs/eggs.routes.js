import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './eggs.schema.js';
import * as service from './eggs.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.user.id))));
router.post('/incubate', validate(schema.incubate), asyncHandler(async (req, res) => res.status(201).json(await service.incubate(req.user.id, req.body.itemId))));
router.post('/:id/speedup', validate(schema.speedup), asyncHandler(async (req, res) => res.json(await service.speedup(req.user.id, req.params.id, req.body.itemId))));
router.post('/:id/hatch', validate(schema.hatch), asyncHandler(async (req, res) => res.json(await service.hatch(req.user.id, req.params.id))));

export default router;
