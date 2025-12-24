import express from 'express';
import {
  createService,
  getServicesByBusiness,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService,
  reorderServices,
} from '../controllers/serviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.post('/', protect, createService);
router.get('/business/:businessId', protect, getServicesByBusiness);
router.put('/business/:businessId/reorder', protect, reorderServices);
router.put('/:id/toggle', protect, toggleServiceStatus); // Must be before /:id route
router.get('/:id', protect, getServiceById);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

export default router;
