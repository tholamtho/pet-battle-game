import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as service from './example.service.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.user.id))));

export default router;
