// src/routes/grinder.routes.ts
import { Router } from 'express';
import grinderController from '../controllers/grinder.controller';

const router = Router();

// GET /api/grinders - Get all grinders
router.get('/', grinderController.all.bind(grinderController));

// GET /api/grinders/:id - Get a single grinder by ID
router.get('/:id', grinderController.one.bind(grinderController));

// POST /api/grinders - Create a new grinder
router.post('/', grinderController.save.bind(grinderController));

// PUT /api/grinders/:id - Update a grinder
router.put('/:id', grinderController.update.bind(grinderController));

// DELETE /api/grinders/:id - Delete a grinder
router.delete('/:id', grinderController.remove.bind(grinderController));

export default router;