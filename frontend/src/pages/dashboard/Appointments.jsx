import { useState, useEffect, useCallback, useRef } from 'react';
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

const ITEMS_PER_PAGE = 25;

const Appointments = () => {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useBusiness();
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateMode, setDateMode] = useState('single');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0, today: 0, upcoming: 0, past: 0, cancelled: 0, pending: 0
  });

  // Debounce timer for search
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Fetch employees once
  useEffect(() => {
    if (business?.id && business?.settings?.allowEmployeeBooking) {
      fetchEmployees();
    }
  }, [business]);

  // Fetch appointments when any filter/page/sort changes
  useEffect(() => {
    if (business?.id) {
      fetchAppointments();
    }
  }, [business?.id, activeFilter, debouncedSearch, selectedDate, endDate, dateMode, selectedEmployee, currentPage, sortDirection]);

  // Listen for real-time refresh events (new appointments, status changes)
  useRefreshListener(REFRESH_EVENTS.APPOINTMENTS, useCallback(() => {
    console.log('🔄 Refreshing appointments list...');
    fetchAppointments();
  }, [business?.id, activeFilter, debouncedSearch, selectedDate, endDate, dateMode, selectedEmployee, currentPage, sortDirection]));

  const fetchAppointments = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      setError(null);

      const filters = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortDirection,
      };

      // Use tab-based filtering when no specific date is selected
      if (dateMode === 'single' && selectedDate) {
        filters.startDate = selectedDate;
        filters.endDate = selectedDate;
      } else if (dateMode === 'range' && selectedDate && endDate) {
        filters.startDate = selectedDate;
        filters.endDate = endDate;
      } else {
        filters.tab = activeFilter;
      }

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      if (selectedEmployee) {
        filters.employeeId = selectedEmployee;
      }

      const response = await getAppointments(business.id, filters);
      setAppointments(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.totalPages || 0);
      if (response.counts) {
        setTabCounts(response.counts);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load appointments');
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

  // Reset page when filters change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleEmployeeChange = (value) => {
    setSelectedEmployee(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value) => {
    setSelectedDate(value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    setCurrentPage(1);
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    setEndDate('');
    setCurrentPage(1);
  };

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
    setSortDirection((prev) => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'today', label: 'Today', count: tabCounts.today },
    { key: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
    { key: 'pending', label: 'Pending', count: tabCounts.pending },
    { key: 'past', label: 'Past', count: tabCounts.past },
    { key: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
  ];

  // Calculate pagination display
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error && !appointments.length) {
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
                onClick={() => handleFilterChange(filter.key)}
                className="gap-2"
              >
                {filter.label}
                <Badge variant={activeFilter === filter.key ? 'secondary' : 'outline'}>
                  {filter.count}
                </Badge>
              </Button>
            ))}
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
            <div className="flex rounded-md border border-input overflow-hidden">
              <button
                type="button"
                onClick={() => handleDateModeChange('single')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  dateMode === 'single'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => handleDateModeChange('range')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  dateMode === 'range'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Range
              </button>
            </div>
            <Input
              id="date-selector"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-[160px]"
            />
            {dateMode === 'range' && (
              <>
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  id="date-end-selector"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={selectedDate}
                  className="w-[160px]"
                />
              </>
            )}
            {(selectedDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { handleDateChange(''); setEndDate(''); }}
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
                onChange={(e) => handleEmployeeChange(e.target.value)}
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
                  onClick={() => handleEmployeeChange('')}
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
            {totalCount} appointment{totalCount !== 1 ? 's' : ''} found
            {selectedEmployee && selectedEmployee !== 'unassigned' && (
              <> for <span className="font-medium">{employees.find(e => e.id === selectedEmployee)?.name}</span></>
            )}
            {selectedEmployee === 'unassigned' && (
              <> <span className="font-medium">(unassigned)</span></>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No appointments found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {debouncedSearch
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
                  {appointments.map((appointment, index) => (
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
                  Page {currentPage} of {totalPages} • Showing {appointments.length} of {totalCount} items
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
                      {(() => {
                        // Show max 7 page buttons with ellipsis for large page counts
                        const pages = [];
                        const maxButtons = 7;
                        if (totalPages <= maxButtons) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          let start = Math.max(2, currentPage - 1);
                          let end = Math.min(totalPages - 1, currentPage + 1);
                          if (currentPage <= 3) { start = 2; end = 5; }
                          if (currentPage >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }
                          if (start > 2) pages.push('...');
                          for (let i = start; i <= end; i++) pages.push(i);
                          if (end < totalPages - 1) pages.push('...');
                          pages.push(totalPages);
                        }
                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        );
                      })()}
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
