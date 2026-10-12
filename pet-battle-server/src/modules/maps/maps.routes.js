import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './maps.schema.js';
import * as service from './maps.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.user.id))));
router.get('/:id', validate(schema.getMap), asyncHandler(async (req, res) => res.json(await service.get(req.user.id, req.params.id))));
router.post('/:id/enter', validate(schema.enterMap), asyncHandler(async (req, res) => res.json(await service.enter(req.user.id, req.params.id))));
router.post('/:id/encounter', validate(schema.encounter), asyncHandler(async (req, res) => res.json(await service.encounter(req.user.id, req.params.id))));

export default router;
