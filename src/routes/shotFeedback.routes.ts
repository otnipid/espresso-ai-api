// src/routes/shot.routes.ts
import { Router } from 'express';
import shotFeedbackController from '../controllers/shotFeedback.controller';

const router = Router();

// GET /api/shots - Get all shots
router.get('/', shotFeedbackController.all.bind(shotFeedbackController));

// GET /api/shots/:id - Get a single shot by ID
router.get('/:id', shotFeedbackController.one.bind(shotFeedbackController));

// POST /api/shots - Create a new shot
router.post('/', shotFeedbackController.save.bind(shotFeedbackController));

// PUT /api/shots/:id - Update a shot
router.put('/:id', shotFeedbackController.update.bind(shotFeedbackController));

// DELETE /api/shots/:id - Delete a shot
router.delete('/:id', shotFeedbackController.remove.bind(shotFeedbackController));

export default router;