import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
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
} from '../../services/employeesService';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const EmployeeAvailabilityDialog = ({ open, onOpenChange, employee }) => {
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' or 'special'

  // Sub-dialog states
  const [showAddHoursDialog, setShowAddHoursDialog] = useState(false);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showAddBreakDialog, setShowAddBreakDialog] = useState(false);
  const [showAddSpecialDateDialog, setShowAddSpecialDateDialog] = useState(false);
  const [showEditSpecialDateDialog, setShowEditSpecialDateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [hoursForm, setHoursForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });

  const [breakForm, setBreakForm] = useState({
    startTime: '12:00',
    endTime: '13:00',
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
    if (open && employee?.id) {
      fetchData();
    }
  }, [open, employee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availabilityResponse, specialDatesResponse] = await Promise.all([
        getEmployeeAvailability(employee.id),
        getEmployeeSpecialDates(employee.id),
      ]);
      setWorkingHours(availabilityResponse.availability || []);
      setSpecialDates(specialDatesResponse.specialDates || []);
    } catch (err) {
      console.error('Error fetching employee availability:', err);
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromBusiness = async () => {
    try {
      setActionLoading(true);
      await copyBusinessAvailability(employee.id);
      await fetchData();
      toast({
        title: "Success!",
        description: "Business hours copied successfully",
        variant: "success",
      });
    } catch (err) {
      console.error('Error copying business hours:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to copy business hours",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

  const resetBreakForm = () => {
    setBreakForm({
      startTime: '12:00',
      endTime: '13:00',
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

  const validateBreakForm = () => {
    const errors = {};
    if (breakForm.startTime >= breakForm.endTime) {
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
      await createEmployeeAvailability(employee.id, hoursForm);
      await fetchData();
      setShowAddHoursDialog(false);
      resetHoursForm();
      toast({ title: "Success!", description: "Working hours created", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create working hours", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditWorkingHours = async () => {
    if (!validateHoursForm()) return;
    try {
      setActionLoading(true);
      await updateEmployeeAvailability(employee.id, selectedItem.id, hoursForm);
      await fetchData();
      setShowEditHoursDialog(false);
      setSelectedItem(null);
      resetHoursForm();
      toast({ title: "Success!", description: "Working hours updated", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update working hours", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBreak = async () => {
    if (!validateBreakForm()) return;
    try {
      setActionLoading(true);
      await createEmployeeBreak(employee.id, selectedAvailability.id, breakForm);
      await fetchData();
      setShowAddBreakDialog(false);
      setSelectedAvailability(null);
      resetBreakForm();
      toast({ title: "Success!", description: "Break added", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add break", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBreak = async (availabilityId, breakId) => {
    try {
      setActionLoading(true);
      await deleteEmployeeBreak(employee.id, availabilityId, breakId);
      await fetchData();
      toast({ title: "Success!", description: "Break deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete break", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSpecialDate = async () => {
    if (!validateSpecialDateForm()) return;
    try {
      setActionLoading(true);
      const payload = {
        date: specialDateForm.date,
        isAvailable: specialDateForm.isAvailable,
        reason: specialDateForm.reason,
      };
      if (specialDateForm.isAvailable) {
        payload.startTime = specialDateForm.startTime;
        payload.endTime = specialDateForm.endTime;
      }
      await createEmployeeSpecialDate(employee.id, payload);
      await fetchData();
      setShowAddSpecialDateDialog(false);
      resetSpecialDateForm();
      toast({ title: "Success!", description: "Special date created", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create special date", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSpecialDate = async () => {
    if (!validateSpecialDateForm()) return;
    try {
      setActionLoading(true);
      const payload = {
        date: specialDateForm.date,
        isAvailable: specialDateForm.isAvailable,
        reason: specialDateForm.reason,
      };
      if (specialDateForm.isAvailable) {
        payload.startTime = specialDateForm.startTime;
        payload.endTime = specialDateForm.endTime;
      }
      await updateEmployeeSpecialDate(employee.id, selectedItem.id, payload);
      await fetchData();
      setShowEditSpecialDateDialog(false);
      setSelectedItem(null);
      resetSpecialDateForm();
      toast({ title: "Success!", description: "Special date updated", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update special date", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      if (deleteType === 'hours') {
        await deleteEmployeeAvailability(employee.id, selectedItem.id);
      } else if (deleteType === 'special') {
        await deleteEmployeeSpecialDate(employee.id, selectedItem.id);
      }
      await fetchData();
      setShowDeleteDialog(false);
      setSelectedItem(null);
      setDeleteType(null);
      toast({ title: "Success!", description: "Item deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
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

  const openAddBreakDialog = (availability) => {
    setSelectedAvailability(availability);
    resetBreakForm();
    setShowAddBreakDialog(true);
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Availability for {employee?.name}</DialogTitle>
            <DialogDescription>
              Manage working hours and special dates. Leave empty to use business default hours.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'hours'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('hours')}
                >
                  <Clock className="inline-block h-4 w-4 mr-2" />
                  Working Hours
                </button>
                <button
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'special'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('special')}
                >
                  <Calendar className="inline-block h-4 w-4 mr-2" />
                  Special Dates
                </button>
              </div>

              {/* Working Hours Tab */}
              {activeTab === 'hours' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {workingHours.length === 0
                        ? 'No custom hours set. Using business default hours.'
                        : 'Custom working hours for this employee.'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyFromBusiness}
                        disabled={actionLoading}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy from Business
                      </Button>
                      <Button size="sm" onClick={() => setShowAddHoursDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hours
                      </Button>
                    </div>
                  </div>

                  {workingHours.length > 0 && (
                    <div className="space-y-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const dayHours = workingHours.filter(h => h.dayOfWeek === day.value);
                        if (dayHours.length === 0) return null;
                        return (
                          <div key={day.value} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{day.label}</p>
                            </div>
                            {dayHours.map((hours) => (
                              <div key={hours.id} className="mt-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="success" className="text-xs">
                                    {hours.startTime} - {hours.endTime}
                                  </Badge>
                                  {hours.breaks?.map((brk) => (
                                    <Badge key={brk.id} variant="secondary" className="text-xs flex items-center gap-1">
                                      <Coffee className="h-3 w-3" />
                                      Break: {brk.startTime} - {brk.endTime}
                                      <button
                                        onClick={() => handleDeleteBreak(hours.id, brk.id)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openAddBreakDialog(hours)}
                                  >
                                    <Coffee className="h-3 w-3 mr-1" />
                                    Add Break
                                  </Button>
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
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Special Dates Tab */}
              {activeTab === 'special' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Mark holidays, time off, or custom availability for specific dates.
                    </p>
                    <Button size="sm" onClick={() => setShowAddSpecialDateDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Special Date
                    </Button>
                  </div>

                  {specialDates.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No special dates configured
                      </p>
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
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            {specialDate.isAvailable && specialDate.startTime && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {specialDate.startTime} - {specialDate.endTime}
                              </p>
                            )}
                            {specialDate.reason && (
                              <p className="text-sm text-muted-foreground">{specialDate.reason}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditSpecialDateDialog(specialDate)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
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
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Working Hours Dialog */}
      <Dialog open={showAddHoursDialog} onOpenChange={setShowAddHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Working Hours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <select
                value={hoursForm.dayOfWeek}
                onChange={(e) => setHoursForm({ ...hoursForm, dayOfWeek: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={hoursForm.startTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={hoursForm.endTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, endTime: e.target.value })}
                />
              </div>
            </div>
            {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddHoursDialog(false); resetHoursForm(); }} disabled={actionLoading}>
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <select
                value={hoursForm.dayOfWeek}
                onChange={(e) => setHoursForm({ ...hoursForm, dayOfWeek: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={hoursForm.startTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={hoursForm.endTime}
                  onChange={(e) => setHoursForm({ ...hoursForm, endTime: e.target.value })}
                />
              </div>
            </div>
            {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditHoursDialog(false); setSelectedItem(null); resetHoursForm(); }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditWorkingHours} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Break Dialog */}
      <Dialog open={showAddBreakDialog} onOpenChange={setShowAddBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Break</DialogTitle>
            <DialogDescription>
              Add a break time within {selectedAvailability && getDayLabel(selectedAvailability.dayOfWeek)} working hours
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={breakForm.startTime}
                  onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={breakForm.endTime}
                  onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                />
              </div>
            </div>
            {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddBreakDialog(false); setSelectedAvailability(null); resetBreakForm(); }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddBreak} disabled={actionLoading}>
              {actionLoading ? 'Adding...' : 'Add Break'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Special Date Dialog */}
      <Dialog open={showAddSpecialDateDialog} onOpenChange={setShowAddSpecialDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Special Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={specialDateForm.date}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value })}
              />
              {formErrors.date && <p className="text-sm text-destructive">{formErrors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <select
                value={specialDateForm.isAvailable ? 'true' : 'false'}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, isAvailable: e.target.value === 'true' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">Unavailable (Day Off)</option>
                <option value="true">Available (Custom Hours)</option>
              </select>
            </div>
            {specialDateForm.isAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={specialDateForm.startTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={specialDateForm.endTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input
                value={specialDateForm.reason}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, reason: e.target.value })}
                placeholder="e.g., Vacation, Training, etc."
              />
            </div>
            {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSpecialDateDialog(false); resetSpecialDateForm(); }} disabled={actionLoading}>
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={specialDateForm.date}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value })}
              />
              {formErrors.date && <p className="text-sm text-destructive">{formErrors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <select
                value={specialDateForm.isAvailable ? 'true' : 'false'}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, isAvailable: e.target.value === 'true' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">Unavailable (Day Off)</option>
                <option value="true">Available (Custom Hours)</option>
              </select>
            </div>
            {specialDateForm.isAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={specialDateForm.startTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={specialDateForm.endTime}
                    onChange={(e) => setSpecialDateForm({ ...specialDateForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input
                value={specialDateForm.reason}
                onChange={(e) => setSpecialDateForm({ ...specialDateForm, reason: e.target.value })}
                placeholder="e.g., Vacation, Training, etc."
              />
            </div>
            {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditSpecialDateDialog(false); setSelectedItem(null); resetSpecialDateForm(); }} disabled={actionLoading}>
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
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedItem(null); setDeleteType(null); }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeeAvailabilityDialog;
