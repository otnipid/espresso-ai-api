import { Router } from 'express';
import machineController from '../controllers/machine.controller';

const router = Router();

// GET /api/machines - Get all machines
router.get('/', machineController.all.bind(machineController));

// GET /api/machines/:id - Get a single machine by ID
router.get('/:id', machineController.one.bind(machineController));

// POST /api/machines - Create a new machine
router.post('/', machineController.save.bind(machineController));

// PUT /api/machines/:id - Update a machine
router.put('/:id', machineController.update.bind(machineController));

// DELETE /api/machines/:id - Delete a machine
router.delete('/:id', machineController.remove.bind(machineController));

export default router;
