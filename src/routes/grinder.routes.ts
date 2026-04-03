import { Router } from 'express';
import GrinderController from '../controllers/grinder.controller';

const router = Router();

// GET /api/grinders
router.get('/', GrinderController.all);

// POST /api/grinders
router.post('/', GrinderController.save);

// GET /api/grinders/:id
router.get('/:id', GrinderController.one);

// PUT /api/grinders/:id
router.put('/:id', GrinderController.update);

// DELETE /api/grinders/:id
router.delete('/:id', GrinderController.remove);

// GET /api/grinders/by-manufacturer
router.get('/by-manufacturer', GrinderController.getGrindersByManufacturer);

export default router;
