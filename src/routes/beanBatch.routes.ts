// src/routes/beanBatch.routes.ts
import { Router } from 'express';
import beanBatchController from '../controllers/beanBatch.controller';

const router = Router();

// GET /api/batches - Get all bean batches
router.get('/', beanBatchController.all.bind(beanBatchController));

// GET /api/batches/:id - Get a single bean batch by ID
router.get('/:id', beanBatchController.one.bind(beanBatchController));

// POST /api/batches - Create a new bean batch
router.post('/', beanBatchController.save.bind(beanBatchController));

// PUT /api/batches/:id - Update a bean batch
router.put('/:id', beanBatchController.update.bind(beanBatchController));

// DELETE /api/batches/:id - Delete a bean batch
router.delete('/:id', beanBatchController.remove.bind(beanBatchController));

export default router;