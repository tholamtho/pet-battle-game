import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import * as schema from './species.schema.js';
import * as service from './species.service.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => res.json(await service.list())));
router.get('/:id', validate(schema.getSpecies), asyncHandler(async (req, res) => res.json(await service.get(req.params.id))));

export default router;
