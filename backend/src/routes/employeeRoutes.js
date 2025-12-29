import express from 'express';
import {
  createEmployee,
  getEmployeesByBusiness,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  assignServices,
  removeService,
  getEmployeesByService,
} from '../controllers/employeeController.js';
import {
  getEmployeeAvailability,
  createEmployeeAvailability,
  updateEmployeeAvailability,
  deleteEmployeeAvailability,
  copyBusinessAvailability,
  createEmployeeBreak,
  deleteEmployeeBreak,
  getEmployeeSpecialDates,
  createEmployeeSpecialDate,
  updateEmployeeSpecialDate,
  deleteEmployeeSpecialDate,
} from '../controllers/employeeAvailabilityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)

// Employee CRUD
router.post('/', protect, createEmployee);
router.get('/business/:businessId', protect, getEmployeesByBusiness);
router.get('/service/:serviceId', protect, getEmployeesByService);
router.put('/:id/toggle', protect, toggleEmployeeStatus);
router.post('/:id/services', protect, assignServices);
router.delete('/:id/services/:serviceId', protect, removeService);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);

// Employee Availability
router.get('/:employeeId/availability', protect, getEmployeeAvailability);
router.post('/:employeeId/availability', protect, createEmployeeAvailability);
router.post('/:employeeId/availability/copy-from-business', protect, copyBusinessAvailability);
router.put('/:employeeId/availability/:availabilityId', protect, updateEmployeeAvailability);
router.delete('/:employeeId/availability/:availabilityId', protect, deleteEmployeeAvailability);

// Employee Breaks
router.post('/:employeeId/availability/:availabilityId/breaks', protect, createEmployeeBreak);
router.delete('/:employeeId/availability/:availabilityId/breaks/:breakId', protect, deleteEmployeeBreak);

// Employee Special Dates
router.get('/:employeeId/special-dates', protect, getEmployeeSpecialDates);
router.post('/:employeeId/special-dates', protect, createEmployeeSpecialDate);
router.put('/:employeeId/special-dates/:specialDateId', protect, updateEmployeeSpecialDate);
router.delete('/:employeeId/special-dates/:specialDateId', protect, deleteEmployeeSpecialDate);

export default router;
