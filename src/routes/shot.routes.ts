// src/routes/shot.routes.ts
import { Router } from 'express';
import shotController from '../controllers/shot.controller';
import {
  validateShotQuery,
  validateCreateShot,
  validateUpdateShot,
  validateShotId,
  validateBulkShotIds,
  validateExportOptions,
  validate,
  BulkShotIdsSchema,
} from '../middleware/validation/shotValidation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/shots - Get all shots with filtering and pagination
router.get('/', 
  validateShotQuery,
  asyncHandler(shotController.all.bind(shotController))
);

// GET /api/shots/export - Export shots data
router.get('/export',
  validateExportOptions,
  asyncHandler(shotController.all.bind(shotController))
);

// GET /api/shots/:id - Get a single shot by ID
router.get('/:id',
  validateShotId,
  asyncHandler(shotController.one.bind(shotController))
);

// POST /api/shots - Create a new shot
router.post('/',
  validateCreateShot,
  asyncHandler(shotController.save.bind(shotController))
);

// POST /api/shots/bulk - Create multiple shots
router.post('/bulk',
  validate(BulkShotIdsSchema, 'body'),
  asyncHandler(async (req: any, res: any) => {
    // Bulk creation logic would go here
    res.status(501).json({ message: 'Bulk creation not yet implemented' });
  })
);

// PUT /api/shots/:id - Update a shot
router.put('/:id',
  [...validateShotId, ...validateUpdateShot],
  asyncHandler(shotController.update.bind(shotController))
);

// PATCH /api/shots/:id - Partial update a shot
router.patch('/:id',
  [...validateShotId, ...validateUpdateShot],
  asyncHandler(shotController.update.bind(shotController))
);

// DELETE /api/shots/:id - Delete a shot
router.delete('/:id',
  validateShotId,
  asyncHandler(shotController.remove.bind(shotController))
);

// DELETE /api/shots/bulk - Bulk delete shots
router.delete('/bulk',
  validateBulkShotIds,
  asyncHandler(async (req: any, res: any) => {
    // Bulk deletion logic would go here
    res.status(501).json({ message: 'Bulk deletion not yet implemented' });
  })
);

export default router;