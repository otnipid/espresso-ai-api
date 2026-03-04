// src/routes/shotPreparation.routes.ts
import { Router } from 'express';
import shotPreparationController from '../controllers/shotPreparation.controller';
const router = Router();
// GET /api/preparations - Get all shot preparations
router.get('/', shotPreparationController.all.bind(shotPreparationController));
// GET /api/preparations/:id - Get a single shot preparation by ID
router.get('/:id', shotPreparationController.one.bind(shotPreparationController));
// POST /api/preparations - Create a new shot preparation
router.post('/', shotPreparationController.save.bind(shotPreparationController));
// PUT /api/preparations/:id - Update a shot preparation
router.put('/:id', shotPreparationController.update.bind(shotPreparationController));
// DELETE /api/preparations/:id - Delete a shot preparation
router.delete('/:id', shotPreparationController.remove.bind(shotPreparationController));
export default router;
