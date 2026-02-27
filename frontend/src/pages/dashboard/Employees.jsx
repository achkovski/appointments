import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Clock,
  Briefcase,
  Check,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { toastSuccess, toastError } from '../../utils/toastHelpers';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  assignServices,
} from '../../services/employeesService';
import { getServices } from '../../services/servicesService';
import EmployeeAvailabilityDialog from '../../components/employees/EmployeeAvailabilityDialog';

const Employees = () => {
  const { business, loading: businessLoading } = useBusiness();
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    useBusinessEmail: false,
    useBusinessPhone: false,
    maxDailyAppointments: 0,
  });
  const [formErrors, setFormErrors] = useState({});

  // Service assignment state
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    if (business?.id) {
      fetchData();
    }
  }, [business]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesResponse, servicesResponse] = await Promise.all([
        getEmployees(business.id),
        getServices(business.id),
      ]);
      setEmployees(employeesResponse.employees || []);
      setServices(servicesResponse.services || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      useBusinessEmail: false,
      useBusinessPhone: false,
      maxDailyAppointments: 0,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Employee name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (formData.maxDailyAppointments && formData.maxDailyAppointments < 0) {
      errors.maxDailyAppointments = 'Must be 0 or greater';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const employeeData = {
        businessId: business.id,
        name: formData.name.trim(),
        email: formData.useBusinessEmail ? null : formData.email?.trim() || null,
        phone: formData.useBusinessPhone ? null : formData.phone?.trim() || null,
        useBusinessEmail: formData.useBusinessEmail,
        useBusinessPhone: formData.useBusinessPhone,
        maxDailyAppointments: parseInt(formData.maxDailyAppointments) || 0,
      };
      await createEmployee(employeeData);
      await fetchData();
      setShowAddDialog(false);
      resetForm();
      toastSuccess("Success!", "Employee created successfully");
    } catch (err) {
      console.error('Error creating employee:', err);
      toastError("Error", err.response?.data?.message || 'Failed to create employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const employeeData = {
        name: formData.name.trim(),
        email: formData.useBusinessEmail ? null : formData.email?.trim() || null,
        phone: formData.useBusinessPhone ? null : formData.phone?.trim() || null,
        useBusinessEmail: formData.useBusinessEmail,
        useBusinessPhone: formData.useBusinessPhone,
        maxDailyAppointments: parseInt(formData.maxDailyAppointments) || 0,
      };
      await updateEmployee(selectedEmployee.id, employeeData);
      await fetchData();
      setShowEditDialog(false);
      setSelectedEmployee(null);
      resetForm();
      toastSuccess("Success!", "Employee updated successfully");
    } catch (err) {
      console.error('Error updating employee:', err);
      toastError("Error", err.response?.data?.message || 'Failed to update employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      setActionLoading(true);
      await deleteEmployee(selectedEmployee.id);
      await fetchData();
      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      toastSuccess("Success!", "Employee deleted successfully. Appointments have been reassigned.");
    } catch (err) {
      console.error('Error deleting employee:', err);
      toastError("Error", err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      await toggleEmployeeStatus(employee.id);
      await fetchData();
      toastSuccess("Success!", `Employee ${employee.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Error toggling employee status:', err);
      toastError("Error", err.response?.data?.message || 'Failed to toggle employee status');
    }
  };

  const handleAssignServices = async () => {
    try {
      setActionLoading(true);
      await assignServices(selectedEmployee.id, selectedServices);
      await fetchData();
      setShowServicesDialog(false);
      setSelectedEmployee(null);
      setSelectedServices([]);
      toastSuccess("Success!", "Services assigned successfully");
    } catch (err) {
      console.error('Error assigning services:', err);
      toastError("Error", err.response?.data?.message || 'Failed to assign services');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      useBusinessEmail: employee.useBusinessEmail || false,
      useBusinessPhone: employee.useBusinessPhone || false,
      maxDailyAppointments: employee.maxDailyAppointments || 0,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
  };

  const openServicesDialog = (employee) => {
    setSelectedEmployee(employee);
    const assignedServiceIds = employee.services?.map(s => s.id) || [];
    setSelectedServices(assignedServiceIds);
    setShowServicesDialog(true);
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getEmployeeContactInfo = (employee) => {
    const email = employee.useBusinessEmail ? business?.email : employee.email;
    const phone = employee.useBusinessPhone ? business?.phone : employee.phone;
    return { email, phone };
  };

  if (businessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Employees</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">
            Manage your team members and their service assignments
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Employee Booking Status */}
      {!business?.settings?.allowEmployeeBooking && (
        <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Employee booking is disabled</p>
            <p className="text-sm text-yellow-700">
              Clients cannot choose specific employees when booking. Enable "Allow employee booking" in Settings to allow this.
            </p>
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>
              Employees who can provide services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Employees Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add employees to assign them to services and manage their schedules.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
            const contactInfo = getEmployeeContactInfo(employee);
            return (
              <Card key={employee.id} className={`flex flex-col h-full ${!employee.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3 flex-none">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      {!employee.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-[2rem]">
                      {employee.services?.length > 0 ? (
                        employee.services.map(service => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No services assigned</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pt-0">
                  <div className="space-y-2 mb-4 min-h-[4rem]">
                    {contactInfo.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{contactInfo.email}</span>
                        {employee.useBusinessEmail && (
                          <Badge variant="secondary" className="text-xs">Business</Badge>
                        )}
                      </div>
                    )}
                    {contactInfo.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contactInfo.phone}</span>
                        {employee.useBusinessPhone && (
                          <Badge variant="secondary" className="text-xs">Business</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {employee.maxDailyAppointments > 0
                          ? `Max ${employee.maxDailyAppointments} appointments/day`
                          : 'No max appointments set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t flex-wrap mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openServicesDialog(employee)}
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      Services
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowAvailabilityDialog(true);
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Hours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(employee)}
                    >
                      {employee.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(employee)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Add a new team member to your business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Employee name"
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@example.com"
                disabled={formData.useBusinessEmail}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useBusinessEmail"
                  checked={formData.useBusinessEmail}
                  onChange={(e) => setFormData({ ...formData, useBusinessEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="useBusinessEmail" className="text-sm font-normal">
                  Use business email ({business?.email})
                </Label>
              </div>
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={formData.useBusinessPhone}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useBusinessPhone"
                  checked={formData.useBusinessPhone}
                  onChange={(e) => setFormData({ ...formData, useBusinessPhone: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="useBusinessPhone" className="text-sm font-normal">
                  Use business phone ({business?.phone || 'Not set'})
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDailyAppointments">Max Daily Appointments</Label>
              <Input
                id="maxDailyAppointments"
                type="number"
                min="0"
                value={formData.maxDailyAppointments}
                onChange={(e) => setFormData({ ...formData, maxDailyAppointments: e.target.value })}
                placeholder="0 (unlimited)"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for unlimited appointments
              </p>
              {formErrors.maxDailyAppointments && (
                <p className="text-sm text-destructive">{formErrors.maxDailyAppointments}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={formData.useBusinessEmail}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-useBusinessEmail"
                  checked={formData.useBusinessEmail}
                  onChange={(e) => setFormData({ ...formData, useBusinessEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-useBusinessEmail" className="text-sm font-normal">
                  Use business email ({business?.email})
                </Label>
              </div>
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={formData.useBusinessPhone}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-useBusinessPhone"
                  checked={formData.useBusinessPhone}
                  onChange={(e) => setFormData({ ...formData, useBusinessPhone: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-useBusinessPhone" className="text-sm font-normal">
                  Use business phone ({business?.phone || 'Not set'})
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maxDailyAppointments">Max Daily Appointments</Label>
              <Input
                id="edit-maxDailyAppointments"
                type="number"
                min="0"
                value={formData.maxDailyAppointments}
                onChange={(e) => setFormData({ ...formData, maxDailyAppointments: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for unlimited appointments
              </p>
              {formErrors.maxDailyAppointments && (
                <p className="text-sm text-destructive">{formErrors.maxDailyAppointments}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedEmployee(null);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Services Dialog */}
      <Dialog open={showServicesDialog} onOpenChange={setShowServicesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Services</DialogTitle>
            <DialogDescription>
              Select services that {selectedEmployee?.name} can provide
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {services.length === 0 ? (
              <div className="text-center py-6">
                <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No services available. Create services first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedServices.includes(service.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => toggleServiceSelection(service.id)}
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration} min • {service.price ? `$${service.price}` : 'Free'}
                      </p>
                    </div>
                    {selectedServices.includes(service.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowServicesDialog(false);
                setSelectedEmployee(null);
                setSelectedServices([]);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignServices} disabled={actionLoading || services.length === 0}>
              {actionLoading ? 'Saving...' : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEmployee?.name}"?
              All existing appointments assigned to this employee will be reassigned to the business owner with a note.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedEmployee(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmployee}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Availability Dialog */}
      <EmployeeAvailabilityDialog
        open={showAvailabilityDialog}
        onOpenChange={(open) => {
          setShowAvailabilityDialog(open);
          if (!open) setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default Employees;
