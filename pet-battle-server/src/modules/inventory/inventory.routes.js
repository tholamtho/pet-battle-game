import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './inventory.schema.js';
import * as service from './inventory.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.user.id))));
router.post('/use', validate(schema.useItem), asyncHandler(async (req, res) => res.json(await service.useOnPet(req.user.id, req.body))));

export default router;
