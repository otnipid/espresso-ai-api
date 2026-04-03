import { Router } from 'express';
import UserController from '../controllers/user.controller';

const router = Router();

// GET /api/users
router.get('/', UserController.all.bind(UserController));

// POST /api/users
router.post('/', UserController.save.bind(UserController));

// GET /api/users/:id
router.get('/:id', UserController.one.bind(UserController));

// PUT /api/users/:id
router.put('/:id', UserController.update.bind(UserController));

// DELETE /api/users/:id
router.delete('/:id', UserController.remove.bind(UserController));

// GET /api/users/by-email
router.get('/by-email', UserController.getUsersByEmail.bind(UserController));

export default router;
