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
  Clock,
  Calendar,
  Coffee,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getBreaks,
  createBreak,
  deleteBreak,
  getSpecialDates,
  createSpecialDate,
  updateSpecialDate,
  deleteSpecialDate,
} from '../../services/availabilityService';
import { useToast } from '../../hooks/use-toast';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const Availability = () => {
  const { business, loading: businessLoading } = useBusiness();
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showAddHoursDialog, setShowAddHoursDialog] = useState(false);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showAddSpecialDateDialog, setShowAddSpecialDateDialog] = useState(false);
  const [showEditSpecialDateDialog, setShowEditSpecialDateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'hours' or 'special'
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [hoursForm, setHoursForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });

  const [specialDateForm, setSpecialDateForm] = useState({
    date: '',
    isAvailable: false,
    startTime: '',
    endTime: '',
    reason: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (business?.id) {
      fetchData();
    }
  }, [business]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [hoursResponse, specialResponse] = await Promise.all([
        getAvailability(business.id),
        getSpecialDates(business.id),
      ]);

      setWorkingHours(hoursResponse.data || hoursResponse.availability || []);
      setSpecialDates(specialResponse.data || specialResponse.specialDates || []);
    } catch (err) {
      console.error('Error fetching availability data:', err);
      setError(err.response?.data?.message || 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const resetHoursForm = () => {
    setHoursForm({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    });
    setFormErrors({});
  };

  const resetSpecialDateForm = () => {
    setSpecialDateForm({
      date: '',
      isAvailable: false,
      startTime: '',
      endTime: '',
      reason: '',
    });
    setFormErrors({});
  };

  const validateHoursForm = () => {
    const errors = {};

    if (hoursForm.startTime >= hoursForm.endTime) {
      errors.time = 'End time must be after start time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSpecialDateForm = () => {
    const errors = {};

    if (!specialDateForm.date) {
      errors.date = 'Date is required';
    }

    if (specialDateForm.isAvailable) {
      if (!specialDateForm.startTime || !specialDateForm.endTime) {
        errors.time = 'Start and end times are required when available';
      } else if (specialDateForm.startTime >= specialDateForm.endTime) {
        errors.time = 'End time must be after start time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddWorkingHours = async () => {
    if (!validateHoursForm()) return;

    try {
      setActionLoading(true);
      await createAvailability(business.id, hoursForm);
      await fetchData();
      setShowAddHoursDialog(false);
      resetHoursForm();
      toast({ title: "Success!", description: "Working hours created successfully", variant: "success" });
    } catch (err) {
      console.error('Error creating working hours:', err);
      toast({ title: "Error", description: err.response?.data?.message || 'Failed to create working hours', variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditWorkingHours = async () => {
    if (!validateHoursForm()) return;

    try {
      setActionLoading(true);
      await updateAvailability(business.id, selectedItem.id, hoursForm);
      await fetchData();
      setShowEditHoursDialog(false);
      setSelectedItem(null);
      resetHoursForm();
      toast({ title: "Success!", description: "Working hours updated successfully", variant: "success" });
    } catch (err) {
      console.error('Error updating working hours:', err);
      toast({ title: "Error", description: err.response?.data?.message || 'Failed to update working hours', variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSpecialDate = async () => {
    if (!validateSpecialDateForm()) return;

    try {
      setActionLoading(true);

      // Only include time fields if the date is available
      const payload = {
        date: specialDateForm.date,
        isAvailable: specialDateForm.isAvailable,
        reason: specialDateForm.reason,
      };

      if (specialDateForm.isAvailable) {
        payload.startTime = specialDateForm.startTime;
        payload.endTime = specialDateForm.endTime;
      }

      await createSpecialDate(business.id, payload);
      await fetchData();
      setShowAddSpecialDateDialog(false);
      resetSpecialDateForm();
      toast({ title: "Success!", description: "Special date created successfully", variant: "success" });
    } catch (err) {
      console.error('Error creating special date:', err);
      toast({ title: "Error", description: err.response?.data?.message || 'Failed to create special date', variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSpecialDate = async () => {
    if (!validateSpecialDateForm()) return;

    try {
      setActionLoading(true);

      // Only include time fields if the date is available
      const payload = {
        date: specialDateForm.date,
        isAvailable: specialDateForm.isAvailable,
        reason: specialDateForm.reason,
      };

      if (specialDateForm.isAvailable) {
        payload.startTime = specialDateForm.startTime;
        payload.endTime = specialDateForm.endTime;
      }

      await updateSpecialDate(business.id, selectedItem.id, payload);
      await fetchData();
      setShowEditSpecialDateDialog(false);
      setSelectedItem(null);
      resetSpecialDateForm();
      toast({ title: "Success!", description: "Special date updated successfully", variant: "success" });
    } catch (err) {
      console.error('Error updating special date:', err);
      toast({ title: "Error", description: err.response?.data?.message || 'Failed to update special date', variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      if (deleteType === 'hours') {
        await deleteAvailability(business.id, selectedItem.id);
      } else if (deleteType === 'special') {
        await deleteSpecialDate(business.id, selectedItem.id);
      }
      await fetchData();
      setShowDeleteDialog(false);
      setSelectedItem(null);
      setDeleteType(null);
      toast({ title: "Success!", description: "Item deleted successfully", variant: "success" });
    } catch (err) {
      console.error('Error deleting:', err);
      toast({ title: "Error", description: err.response?.data?.message || 'Failed to delete item', variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditHoursDialog = (hours) => {
    setSelectedItem(hours);
    setHoursForm({
      dayOfWeek: hours.dayOfWeek,
      startTime: hours.startTime,
      endTime: hours.endTime,
      isAvailable: hours.isAvailable,
    });
    setShowEditHoursDialog(true);
  };

  const openEditSpecialDateDialog = (specialDate) => {
    setSelectedItem(specialDate);
    setSpecialDateForm({
      date: specialDate.date,
      isAvailable: specialDate.isAvailable,
      startTime: specialDate.startTime || '',
      endTime: specialDate.endTime || '',
      reason: specialDate.reason || '',
    });
    setShowEditSpecialDateDialog(true);
  };

  const openDeleteDialog = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const getDayLabel = (dayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (businessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Availability</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability</h2>
        <p className="text-muted-foreground">
          Configure your working hours and availability
        </p>
      </div>

      {/* Working Hours Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
              <CardDescription>
                Set your standard working hours for each day
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddHoursDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Hours
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workingHours.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No working hours configured yet
              </p>
              <Button onClick={() => setShowAddHoursDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Working Hours
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = workingHours.filter(h => h.dayOfWeek === day.value);
                return (
                  <div key={day.value} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{day.label}</p>
                      {dayHours.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Not configured</p>
                      ) : (
                        <div className="flex gap-4 mt-1">
                          {dayHours.map((hours) => (
                            <div key={hours.id} className="flex items-center gap-2">
                              {hours.isAvailable ? (
                                <>
                                  <Badge variant="success" className="text-xs">
                                    {hours.startTime} - {hours.endTime}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditHoursDialog(hours)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(hours, 'hours')}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary">Unavailable</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Dates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Special Dates
              </CardTitle>
              <CardDescription>
                Mark holidays, closures, and custom availability
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddSpecialDateDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Special Date
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {specialDates.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No special dates configured yet
              </p>
              <Button onClick={() => setShowAddSpecialDateDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Special Date
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {specialDates.map((specialDate) => (
                <div key={specialDate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatDate(specialDate.date)}</p>
                      {specialDate.isAvailable ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Closed
                        </Badge>
                      )}
                    </div>
                    {specialDate.isAvailable && specialDate.startTime && specialDate.endTime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {specialDate.startTime} - {specialDate.endTime}
                      </p>
                    )}
                    {specialDate.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{specialDate.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSpecialDateDialog(specialDate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(specialDate, 'special')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Working Hours Dialog */}
      <Dialog open={showAddHoursDialog} onOpenChange={setShowAddHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Working Hours</DialogTitle>
            <DialogDescription>
              Configure working hours for a specific day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <select
                id="dayOfWeek"
                value={hoursForm.dayOfWeek}
                onChange={(e) => setHoursForm({ ...hoursForm, dayOfWeek: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={hoursForm.startTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={hoursForm.endTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, endTime: e.target.value })}
                />
              </div>
            </div>

            {formErrors.time && (
              <p className="text-sm text-destructive">{formErrors.time}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddHoursDialog(false);
                resetHoursForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddWorkingHours} disabled={actionLoading}>
              {actionLoading ? 'Adding...' : 'Add Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Working Hours Dialog */}
      <Dialog open={showEditHoursDialog} onOpenChange={setShowEditHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Working Hours</DialogTitle>
            <DialogDescription>
              Update working hours configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dayOfWeek">Day of Week</Label>
              <select
                id="edit-dayOfWeek"
                value={hoursForm.dayOfWeek}
                onChange={(e) => setHoursForm({ ...hoursForm, dayOfWeek: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={hoursForm.startTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={hoursForm.endTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, endTime: e.target.value })}
                />
              </div>
            </div>

            {formErrors.time && (
              <p className="text-sm text-destructive">{formErrors.time}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditHoursDialog(false);
                setSelectedItem(null);
                resetHoursForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditWorkingHours} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Special Date Dialog */}
      <Dialog open={showAddSpecialDateDialog} onOpenChange={setShowAddSpecialDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Special Date</DialogTitle>
            <DialogDescription>
              Mark a holiday, closure, or custom availability
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={specialDateForm.date}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value })}
              />
              {formErrors.date && (
                <p className="text-sm text-destructive">{formErrors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isAvailable">Availability</Label>
              <select
                id="isAvailable"
                value={specialDateForm.isAvailable ? 'true' : 'false'}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, isAvailable: e.target.value === 'true' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">Closed</option>
                <option value="true">Available (Custom Hours)</option>
              </select>
            </div>

            {specialDateForm.isAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="special-startTime">Start Time</Label>
                  <Input
                    id="special-startTime"
                    type="time"
                    value={specialDateForm.startTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special-endTime">End Time</Label>
                  <Input
                    id="special-endTime"
                    type="time"
                    value={specialDateForm.endTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={specialDateForm.reason}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, reason: e.target.value })}
                placeholder="e.g., Holiday, Vacation, Special Event"
              />
            </div>

            {formErrors.time && (
              <p className="text-sm text-destructive">{formErrors.time}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSpecialDateDialog(false);
                resetSpecialDateForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSpecialDate} disabled={actionLoading}>
              {actionLoading ? 'Adding...' : 'Add Special Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Special Date Dialog */}
      <Dialog open={showEditSpecialDateDialog} onOpenChange={setShowEditSpecialDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Special Date</DialogTitle>
            <DialogDescription>
              Update special date configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={specialDateForm.date}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value })}
              />
              {formErrors.date && (
                <p className="text-sm text-destructive">{formErrors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-isAvailable">Availability</Label>
              <select
                id="edit-isAvailable"
                value={specialDateForm.isAvailable ? 'true' : 'false'}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, isAvailable: e.target.value === 'true' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">Closed</option>
                <option value="true">Available (Custom Hours)</option>
              </select>
            </div>

            {specialDateForm.isAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-special-startTime">Start Time</Label>
                  <Input
                    id="edit-special-startTime"
                    type="time"
                    value={specialDateForm.startTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-special-endTime">End Time</Label>
                  <Input
                    id="edit-special-endTime"
                    type="time"
                    value={specialDateForm.endTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason (Optional)</Label>
              <Input
                id="edit-reason"
                value={specialDateForm.reason}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, reason: e.target.value })}
                placeholder="e.g., Holiday, Vacation, Special Event"
              />
            </div>

            {formErrors.time && (
              <p className="text-sm text-destructive">{formErrors.time}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditSpecialDateDialog(false);
                setSelectedItem(null);
                resetSpecialDateForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSpecialDate} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Special Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteType === 'hours' ? 'working hours' : 'special date'}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedItem(null);
                setDeleteType(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Availability;
