import express from 'express';
import {
  createService,
  getServicesByBusiness,
  getServiceById,
  updateService,
  deleteService,
  reorderServices,
} from '../controllers/serviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.post('/', protect, createService);
router.get('/business/:businessId', protect, getServicesByBusiness);
router.get('/:id', protect, getServiceById);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);
router.put('/business/:businessId/reorder', protect, reorderServices);

export default router;
