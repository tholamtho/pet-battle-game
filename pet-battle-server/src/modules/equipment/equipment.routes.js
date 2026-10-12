import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as schema from './equipment.schema.js';
import * as service from './equipment.service.js';

// Mounted under /pets: PUT/DELETE /pets/:id/equipment/:slot
const router = Router();
router.use(requireAuth);

router.put('/:id/equipment/:slot', validate(schema.equip), asyncHandler(async (req, res) => {
  res.json(await service.equip(req.user.id, req.params.id, req.params.slot, req.body.itemId));
}));
router.delete('/:id/equipment/:slot', validate(schema.unequip), asyncHandler(async (req, res) => {
  res.json(await service.unequip(req.user.id, req.params.id, req.params.slot));
}));

export default router;
