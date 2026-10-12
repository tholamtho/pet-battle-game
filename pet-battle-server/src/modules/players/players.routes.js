import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './players.schema.js';
import * as service from './players.service.js';

const router = Router();
router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => res.json(await service.getMe(req.user.id))));
router.post('/starter', validate(schema.chooseStarter), asyncHandler(async (req, res) => {
  res.status(201).json(await service.chooseStarter(req.user.id, req.body.speciesId));
}));

export default router;
