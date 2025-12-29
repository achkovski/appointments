import crypto from 'crypto';
import { eq, and, inArray } from 'drizzle-orm';
import db from '../config/database.js';
import { employees, employeeServices, businesses, services, appointments } from '../config/schema.js';

// Generate UUID for new records
const generateId = () => crypto.randomUUID();

/**
 * @desc    Create new employee for a business
 * @route   POST /api/employees
 * @access  Private
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      businessId,
      name,
      email,
      phone,
      useBusinessEmail = false,
      useBusinessPhone = false,
      maxDailyAppointments = 0,
      serviceIds = [],
    } = req.body;

    // Validation
    if (!businessId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and employee name are required',
      });
    }

    // Check if business exists and belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found or unauthorized',
      });
    }

    // Validate email if not using business email
    if (!useBusinessEmail && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }
    }

    // Create employee
    const now = new Date().toISOString();
    const employeeId = generateId();

    const [newEmployee] = await db.insert(employees).values({
      id: employeeId,
      businessId,
      name,
      email: useBusinessEmail ? null : (email || null),
      phone: useBusinessPhone ? null : (phone || null),
      useBusinessEmail,
      useBusinessPhone,
      maxDailyAppointments: maxDailyAppointments || 0,
      isActive: true,
      updatedAt: now,
    }).returning();

    // Assign services if provided
    if (serviceIds && serviceIds.length > 0) {
      // Verify all services belong to this business
      const validServices = await db.query.services.findMany({
        where: and(
          eq(services.businessId, businessId),
          inArray(services.id, serviceIds)
        ),
      });

      const validServiceIds = validServices.map(s => s.id);

      if (validServiceIds.length > 0) {
        const serviceAssignments = validServiceIds.map(serviceId => ({
          id: generateId(),
          employeeId,
          serviceId,
        }));

        await db.insert(employeeServices).values(serviceAssignments);
      }
    }

    // Fetch the employee with their assigned services
    const employeeWithServices = await getEmployeeWithServices(employeeId);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: employeeWithServices,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating employee',
      message: error.message,
    });
  }
};

/**
 * @desc    Get all employees for a business
 * @route   GET /api/employees/business/:businessId
 * @access  Private
 */
export const getEmployeesByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { includeInactive = 'false' } = req.query;

    // Check if business exists and belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found or unauthorized',
      });
    }

    // Build query conditions
    let conditions = [eq(employees.businessId, businessId)];
    if (includeInactive !== 'true') {
      conditions.push(eq(employees.isActive, true));
    }

    // Get all employees for business
    const businessEmployees = await db.query.employees.findMany({
      where: and(...conditions),
      orderBy: (employees, { asc }) => [asc(employees.name)],
      with: {
        employeeServices: {
          with: {
            service: true,
          },
        },
      },
    });

    // Transform to include services array
    const employeesWithServices = businessEmployees.map(emp => ({
      ...emp,
      services: emp.employeeServices.map(es => es.service),
      employeeServices: undefined,
    }));

    res.status(200).json({
      success: true,
      count: employeesWithServices.length,
      employees: employeesWithServices,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching employees',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await getEmployeeWithServices(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, employee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching employee',
      message: error.message,
    });
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      useBusinessEmail,
      useBusinessPhone,
      maxDailyAppointments,
      isActive,
      serviceIds,
    } = req.body;

    // Get existing employee
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingEmployee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    // Validate email if provided and not using business email
    if (email && !useBusinessEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (useBusinessEmail !== undefined) {
      updateData.useBusinessEmail = useBusinessEmail;
      if (useBusinessEmail) updateData.email = null;
    }
    if (useBusinessPhone !== undefined) {
      updateData.useBusinessPhone = useBusinessPhone;
      if (useBusinessPhone) updateData.phone = null;
    }
    if (email !== undefined && !updateData.useBusinessEmail) updateData.email = email || null;
    if (phone !== undefined && !updateData.useBusinessPhone) updateData.phone = phone || null;
    if (maxDailyAppointments !== undefined) updateData.maxDailyAppointments = maxDailyAppointments;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update employee
    await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id));

    // Update service assignments if provided
    if (serviceIds !== undefined) {
      // Remove existing assignments
      await db.delete(employeeServices).where(eq(employeeServices.employeeId, id));

      // Add new assignments
      if (serviceIds.length > 0) {
        // Verify all services belong to this business
        const validServices = await db.query.services.findMany({
          where: and(
            eq(services.businessId, existingEmployee.businessId),
            inArray(services.id, serviceIds)
          ),
        });

        const validServiceIds = validServices.map(s => s.id);

        if (validServiceIds.length > 0) {
          const serviceAssignments = validServiceIds.map(serviceId => ({
            id: generateId(),
            employeeId: id,
            serviceId,
          }));

          await db.insert(employeeServices).values(serviceAssignments);
        }
      }
    }

    // Fetch updated employee with services
    const updatedEmployee = await getEmployeeWithServices(id);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating employee',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle employee active/inactive status
 * @route   PUT /api/employees/:id/toggle
 * @access  Private
 */
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing employee
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingEmployee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    // Toggle isActive status
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        isActive: !existingEmployee.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: `Employee ${updatedEmployee.isActive ? 'activated' : 'deactivated'} successfully`,
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Toggle employee status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling employee status',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete employee and reassign appointments to business owner
 * @route   DELETE /api/employees/:id
 * @access  Private
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing employee
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingEmployee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    // Reassign all appointments from this employee to business owner (set employeeId to null)
    // with a reassignment note
    const reassignmentNote = `Reassigned from deleted employee: ${existingEmployee.name}`;

    await db.update(appointments)
      .set({
        employeeId: null,
        reassignmentNote,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.employeeId, id));

    // Delete employee (cascade will delete employeeServices, employeeAvailability, etc.)
    await db.delete(employees).where(eq(employees.id, id));

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully. All appointments have been reassigned to the business owner.',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting employee',
      message: error.message,
    });
  }
};

/**
 * @desc    Assign services to an employee
 * @route   POST /api/employees/:id/services
 * @access  Private
 */
export const assignServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Service IDs array is required',
      });
    }

    // Get existing employee
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingEmployee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    // Verify all services belong to this business
    const validServices = await db.query.services.findMany({
      where: and(
        eq(services.businessId, existingEmployee.businessId),
        inArray(services.id, serviceIds)
      ),
    });

    if (validServices.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid services found',
      });
    }

    // Get existing assignments
    const existingAssignments = await db.query.employeeServices.findMany({
      where: eq(employeeServices.employeeId, id),
    });

    const existingServiceIds = existingAssignments.map(a => a.serviceId);
    const newServiceIds = validServices
      .filter(s => !existingServiceIds.includes(s.id))
      .map(s => s.id);

    // Add new assignments
    if (newServiceIds.length > 0) {
      const serviceAssignments = newServiceIds.map(serviceId => ({
        id: generateId(),
        employeeId: id,
        serviceId,
      }));

      await db.insert(employeeServices).values(serviceAssignments);
    }

    // Fetch updated employee with services
    const updatedEmployee = await getEmployeeWithServices(id);

    res.status(200).json({
      success: true,
      message: 'Services assigned successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Assign services error:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning services',
      message: error.message,
    });
  }
};

/**
 * @desc    Remove service from an employee
 * @route   DELETE /api/employees/:id/services/:serviceId
 * @access  Private
 */
export const removeService = async (req, res) => {
  try {
    const { id, serviceId } = req.params;

    // Get existing employee
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingEmployee.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this employee',
      });
    }

    // Delete the assignment
    await db.delete(employeeServices)
      .where(and(
        eq(employeeServices.employeeId, id),
        eq(employeeServices.serviceId, serviceId)
      ));

    // Fetch updated employee with services
    const updatedEmployee = await getEmployeeWithServices(id);

    res.status(200).json({
      success: true,
      message: 'Service removed successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Remove service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error removing service',
      message: error.message,
    });
  }
};

/**
 * @desc    Get employees for a specific service
 * @route   GET /api/employees/service/:serviceId
 * @access  Private
 */
export const getEmployeesByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { activeOnly = 'true' } = req.query;

    // Get service
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, service.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this service',
      });
    }

    // Get employee-service assignments
    const assignments = await db.query.employeeServices.findMany({
      where: eq(employeeServices.serviceId, serviceId),
      with: {
        employee: true,
      },
    });

    // Filter by active status if needed and transform
    let serviceEmployees = assignments.map(a => a.employee);

    if (activeOnly === 'true') {
      serviceEmployees = serviceEmployees.filter(e => e.isActive);
    }

    res.status(200).json({
      success: true,
      count: serviceEmployees.length,
      employees: serviceEmployees,
    });
  } catch (error) {
    console.error('Get employees by service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching employees',
      message: error.message,
    });
  }
};

// Helper function to get employee with services
async function getEmployeeWithServices(employeeId) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
    with: {
      employeeServices: {
        with: {
          service: true,
        },
      },
    },
  });

  if (!employee) return null;

  return {
    ...employee,
    services: employee.employeeServices.map(es => es.service),
    employeeServices: undefined,
  };
}

export default {
  createEmployee,
  getEmployeesByBusiness,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  assignServices,
  removeService,
  getEmployeesByService,
};
