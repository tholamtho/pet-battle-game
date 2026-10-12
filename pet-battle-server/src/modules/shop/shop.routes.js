import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './shop.schema.js';
import * as service from './shop.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => res.json(service.list()));
router.post('/buy', validate(schema.buy), asyncHandler(async (req, res) => res.json(await service.buy(req.user.id, req.body.itemId, req.body.quantity))));

export default router;
