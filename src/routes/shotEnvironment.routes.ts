// src/routes/shot.routes.ts
import { Router } from 'express';
import shotEnvironmentController from '../controllers/shotEnvironment.controller';

const router = Router();

// GET /api/shots - Get all shots
router.get('/', shotEnvironmentController.all.bind(shotEnvironmentController));

// GET /api/shots/:id - Get a single shot by ID
router.get('/:id', shotEnvironmentController.one.bind(shotEnvironmentController));

// POST /api/shots - Create a new shot
router.post('/', shotEnvironmentController.save.bind(shotEnvironmentController));

// PUT /api/shots/:id - Update a shot
router.put('/:id', shotEnvironmentController.update.bind(shotEnvironmentController));

// DELETE /api/shots/:id - Delete a shot
router.delete('/:id', shotEnvironmentController.remove.bind(shotEnvironmentController));

export default router;
