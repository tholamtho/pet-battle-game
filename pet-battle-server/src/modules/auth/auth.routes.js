import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler.js';
import { validate } from '../../common/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import * as schema from './auth.schema.js';
import * as service from './auth.service.js';

const router = Router();

router.post('/register', authLimiter, validate(schema.register), asyncHandler(async (req, res) => {
  res.status(201).json(await service.register(req.body));
}));
router.post('/login', authLimiter, validate(schema.login), asyncHandler(async (req, res) => {
  res.json(await service.login(req.body));
}));

export default router;
