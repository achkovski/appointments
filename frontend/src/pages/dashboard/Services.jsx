import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
  DollarSign,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { toastSuccess, toastError } from '../../utils/toastHelpers';
import {
  getServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '../../services/servicesService';

const DURATION_OPTIONS = [5, 10, 15, 30, 45, 60, 90, 120];

const Services = () => {
  const { business, loading: businessLoading } = useBusiness();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (business?.id) {
      fetchServices();
    }
  }, [business]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServices(business.id);
      const servicesData = response.services || [];
      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: '',
      isActive: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Service name is required';
    }

    if (!formData.duration || formData.duration < 5) {
      errors.duration = 'Duration must be at least 5 minutes';
    }

    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) < 0)) {
      errors.price = 'Price must be a valid positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddService = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const serviceData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      };
      await createService(business.id, serviceData);
      await fetchServices();
      setShowAddDialog(false);
      resetForm();
      toastSuccess("Success!", "Service created successfully");
    } catch (err) {
      console.error('Error creating service:', err);
      toastError("Error", err.response?.data?.message || 'Failed to create service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const serviceData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      };
      await updateService(selectedService.id, serviceData);
      await fetchServices();
      setShowEditDialog(false);
      setSelectedService(null);
      resetForm();
      toastSuccess("Success!", "Service updated successfully");
    } catch (err) {
      console.error('Error updating service:', err);
      toastError("Error", err.response?.data?.message || 'Failed to update service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async () => {
    try {
      setActionLoading(true);
      await deleteService(selectedService.id);
      await fetchServices();
      setShowDeleteDialog(false);
      setSelectedService(null);
      toastSuccess("Success!", "Service deleted successfully");
    } catch (err) {
      console.error('Error deleting service:', err);
      toastError("Error", err.response?.data?.message || 'Failed to delete service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      await toggleServiceStatus(service.id);
      await fetchServices();
      toastSuccess("Success!", `Service ${service.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Error toggling service status:', err);
      toastError("Error", err.response?.data?.message || 'Failed to toggle service status');
    }
  };

  const openEditDialog = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price || '',
      isActive: service.isActive,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (service) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  if (businessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Services</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchServices}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">
            Manage your business services and offerings
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>
              Services that clients can book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first service to enable bookings.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={`flex flex-col h-full ${!service.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3 flex-none">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {!service.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {service.description || '\u00A0'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <span className="text-sm">{service.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <span className="text-sm">
                      {service.price ? `$${service.price}` : '$0'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(service)}
                  >
                    {service.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(service)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service that clients can book
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Haircut, Massage, Consultation"
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} min
                    </option>
                  ))}
                </select>
                {formErrors.duration && (
                  <p className="text-sm text-destructive">{formErrors.duration}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Optional"
                />
                {formErrors.price && (
                  <p className="text-sm text-destructive">{formErrors.price}</p>
                )}
              </div>
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
            <Button onClick={handleAddService} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Service Name *</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                <select
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} min
                    </option>
                  ))}
                </select>
                {formErrors.duration && (
                  <p className="text-sm text-destructive">{formErrors.duration}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                {formErrors.price && (
                  <p className="text-sm text-destructive">{formErrors.price}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedService(null);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditService} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
              Existing appointments using this service will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedService(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteService}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
