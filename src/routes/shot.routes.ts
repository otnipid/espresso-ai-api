// src/routes/shot.routes.ts
import { Router } from 'express';
import shotController from '../controllers/shot.controller';

const router = Router();

// GET /api/shots - Get all shots
router.get('/', shotController.all.bind(shotController));

// GET /api/shots/:id - Get a single shot by ID
router.get('/:id', shotController.one.bind(shotController));

// POST /api/shots - Create a new shot
router.post('/', shotController.save.bind(shotController));

// PUT /api/shots/:id - Update a shot
router.put('/:id', shotController.update.bind(shotController));

// DELETE /api/shots/:id - Delete a shot
router.delete('/:id', shotController.remove.bind(shotController));

export default router;