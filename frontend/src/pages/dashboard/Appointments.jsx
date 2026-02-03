import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import CreateAppointmentDialog from '../../components/appointments/CreateAppointmentDialog';
import StatusBadge from '../../components/appointments/StatusBadge';
import { useBusiness } from '../../context/BusinessContext';
import { getAppointments } from '../../services/appointmentsService';
import { getEmployees } from '../../services/employeesService';
import { useRefreshListener, REFRESH_EVENTS } from '../../components/notifications/NotificationListener';

const Appointments = () => {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useBusiness();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc', or null
  const itemsPerPage = 25;

  // Fetch appointments and employees when business is loaded
  useEffect(() => {
    if (business?.id) {
      fetchAppointments();
      if (business?.settings?.allowEmployeeBooking) {
        fetchEmployees();
      }
    }
  }, [business]);

  // Listen for real-time refresh events (new appointments, status changes)
  useRefreshListener(REFRESH_EVENTS.APPOINTMENTS, useCallback(() => {
    console.log('🔄 Refreshing appointments list...');
    fetchAppointments();
  }, [business?.id]));

  const fetchAppointments = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments(business.id, {});
      const appointmentsData = response.data || response.appointments || [];
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees(business.id);
      setEmployees(response.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Filter appointments based on status and date
  useEffect(() => {
    let filtered = appointments;

    // Apply selected date filter first (if set)
    if (selectedDate) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
        const selected = new Date(selectedDate + 'T00:00:00');
        return aptDate.getTime() === selected.getTime();
      });
    } else {
      // Apply Today Only filter if no specific date selected
      if (showTodayOnly) {
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const statusUpper = apt.status?.toUpperCase();
          return aptDate >= today && aptDate < tomorrow && statusUpper !== 'CANCELLED';
        });
      }

      // Apply status filter
      if (activeFilter !== 'all') {
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const statusUpper = apt.status?.toUpperCase();
          switch (activeFilter) {
            case 'today':
              return aptDate >= today && aptDate < tomorrow && statusUpper !== 'CANCELLED';
            case 'upcoming':
              return aptDate >= today && statusUpper !== 'CANCELLED' && statusUpper !== 'COMPLETED';
            case 'past':
              return aptDate < today || statusUpper === 'COMPLETED';
            case 'cancelled':
              return statusUpper === 'CANCELLED';
            case 'pending':
              return statusUpper === 'PENDING';
            default:
              return true;
          }
        });
      }
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((apt) =>
        (apt.clientFirstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (apt.clientLastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (apt.clientEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (apt.serviceName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    }

    // Apply employee filter
    if (selectedEmployee) {
      if (selectedEmployee === 'unassigned') {
        filtered = filtered.filter((apt) => !apt.employeeId);
      } else {
        filtered = filtered.filter((apt) => apt.employeeId === selectedEmployee);
      }
    }

    // Apply sorting
    if (sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.startTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.startTime}`);

        if (sortDirection === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [activeFilter, searchQuery, appointments, showTodayOnly, selectedDate, selectedEmployee, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const getStatusBadge = (status, completedAutomatically = false, cancellationReason = null) => {
    return <StatusBadge status={status} size="sm" completedAutomatically={completedAutomatically} cancellationReason={cancellationReason} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(`2000-01-01T${timeString}`);
    if (isNaN(date.getTime())) return 'Invalid Time';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'desc') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'desc';
    });
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: appointments.length },
    {
      key: 'today',
      label: 'Today',
      count: appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const statusUpper = apt.status?.toUpperCase();
        return aptDate >= today && aptDate < tomorrow && statusUpper !== 'CANCELLED';
      }).length
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const statusUpper = apt.status?.toUpperCase();
        return aptDate >= today && statusUpper !== 'CANCELLED' && statusUpper !== 'COMPLETED';
      }).length
    },
    { key: 'pending', label: 'Pending', count: appointments.filter(apt => apt.status?.toUpperCase() === 'PENDING').length },
    {
      key: 'past',
      label: 'Past',
      count: appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const statusUpper = apt.status?.toUpperCase();
        return aptDate < today || statusUpper === 'COMPLETED';
      }).length
    },
    { key: 'cancelled', label: 'Cancelled', count: appointments.filter(apt => apt.status?.toUpperCase() === 'CANCELLED').length },
  ];

  if (businessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Appointments</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAppointments}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">
            Manage all your appointments in one place
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter.key)}
                className="gap-2"
              >
                {filter.label}
                <Badge variant={activeFilter === filter.key ? 'secondary' : 'outline'}>
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Today Only Toggle */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-2">
            <label htmlFor="today-toggle" className="text-sm font-medium cursor-pointer">
              Today Only
            </label>
            <input
              id="today-toggle"
              type="checkbox"
              checked={showTodayOnly}
              onChange={(e) => setShowTodayOnly(e.target.checked)}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-selector" className="text-sm font-medium whitespace-nowrap">
              Select Date:
            </label>
            <Input
              id="date-selector"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate('')}
                className="h-10"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Employee Filter - Only show if employee booking is enabled */}
          {business?.settings?.allowEmployeeBooking && employees.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="employee-filter" className="text-sm font-medium whitespace-nowrap">
                Staff:
              </label>
              <select
                id="employee-filter"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All staff</option>
                <option value="unassigned">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {selectedEmployee && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmployee('')}
                  className="h-10"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
            {selectedEmployee && selectedEmployee !== 'unassigned' && (
              <> for <span className="font-medium">{employees.find(e => e.id === selectedEmployee)?.name}</span></>
            )}
            {selectedEmployee === 'unassigned' && (
              <> <span className="font-medium">(unassigned)</span></>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No appointments found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Create your first appointment to get started'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>
                      <button
                        onClick={toggleSort}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Date & Time
                        {getSortIcon()}
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAppointments.map((appointment, index) => (
                    <TableRow
                      key={appointment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/dashboard/appointments/${appointment.id}`)}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {appointment.clientFirstName} {appointment.clientLastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {appointment.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appointment.service?.name || appointment.serviceName || 'N/A'}</p>
                          {appointment.employee && (
                            <p className="text-sm text-muted-foreground">
                              with {appointment.employee.name}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(appointment.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(appointment.status, appointment.completedAutomatically, appointment.cancellationReason)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">
                              {appointment.clientEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {appointment.clientPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/appointments/${appointment.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • Showing {currentAppointments.length} of {filteredAppointments.length} items
                </p>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        businessId={business?.id}
        onSuccess={() => {
          fetchAppointments();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};

export default Appointments;
