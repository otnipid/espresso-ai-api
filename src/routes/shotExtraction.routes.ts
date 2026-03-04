// src/routes/shotExtraction.routes.ts
import { Router } from 'express';
import shotExtractionController from '../controllers/shotExtraction.controller';
const router = Router();
// GET /api/extractions - Get all shot extractions
router.get('/', shotExtractionController.all.bind(shotExtractionController));
// GET /api/extractions/:id - Get a single shot extraction by ID
router.get('/:id', shotExtractionController.one.bind(shotExtractionController));
// POST /api/extractions - Create a new shot extraction
router.post('/', shotExtractionController.save.bind(shotExtractionController));
// PUT /api/extractions/:id - Update a shot extraction
router.put('/:id', shotExtractionController.update.bind(shotExtractionController));
// DELETE /api/extractions/:id - Delete a shot extraction
router.delete('/:id', shotExtractionController.remove.bind(shotExtractionController));
export default router;
