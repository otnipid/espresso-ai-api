import { Router } from 'express';
import UserController from '../controllers/user.controller';

const router = Router();

// GET /api/users
router.get('/', UserController.all);

// POST /api/users
router.post('/', UserController.save);

// GET /api/users/:id
router.get('/:id', UserController.one);

// PUT /api/users/:id
router.put('/:id', UserController.update);

// DELETE /api/users/:id
router.delete('/:id', UserController.remove);

// GET /api/users/by-email
router.get('/by-email', UserController.getUsersByEmail);

export default router;
