import express from 'express';
import { getUser, updateUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

export default router;
