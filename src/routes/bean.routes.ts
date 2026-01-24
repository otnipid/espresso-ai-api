import { Router } from 'express';
import beanController from '../controllers/bean.controller';

const router = Router();

// GET /api/beans - Get all beans
router.get('/', beanController.all.bind(beanController));

// GET /api/beans/:id - Get a single bean by ID
router.get('/:id', beanController.one.bind(beanController));

// POST /api/beans - Create a new bean
router.post('/', beanController.save.bind(beanController));

// PUT /api/beans/:id - Update a bean
router.put('/:id', beanController.update.bind(beanController));

// DELETE /api/beans/:id - Delete a bean
router.delete('/:id', beanController.remove.bind(beanController));

export default router;
