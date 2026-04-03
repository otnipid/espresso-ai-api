import { Router } from 'express';
import GrinderController from '../controllers/grinder.controller';

const router = Router();

// GET /api/grinders
router.get('/', GrinderController.all.bind(GrinderController));

// POST /api/grinders
router.post('/', GrinderController.save.bind(GrinderController));

// GET /api/grinders/:id
router.get('/:id', GrinderController.one.bind(GrinderController));

// PUT /api/grinders/:id
router.put('/:id', GrinderController.update.bind(GrinderController));

// DELETE /api/grinders/:id
router.delete('/:id', GrinderController.remove.bind(GrinderController));

// GET /api/grinders/by-manufacturer
router.get('/by-manufacturer', GrinderController.getGrindersByManufacturer.bind(GrinderController));

export default router;
