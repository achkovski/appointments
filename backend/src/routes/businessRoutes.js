import express from 'express';
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  getBusinessBySlug,
  updateBusiness,
  deleteBusiness,
  regenerateQRCode,
} from '../controllers/businessController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/slug/:slug', getBusinessBySlug);

// Protected routes (require authentication)
router.post('/', protect, createBusiness);
router.get('/', protect, getBusinesses);
router.get('/:id', protect, getBusinessById);
router.put('/:id', protect, updateBusiness);
router.delete('/:id', protect, deleteBusiness);
router.post('/:id/regenerate-qr', protect, regenerateQRCode);

export default router;
