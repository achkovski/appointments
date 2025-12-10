import { useState, useEffect } from 'react';
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
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// Mock data for testing
const mockAppointments = [
  {
    id: '1',
    clientFirstName: 'John',
    clientLastName: 'Doe',
    clientEmail: 'john.doe@example.com',
    clientPhone: '+1 555-0101',
    appointmentDate: '2025-12-15',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    serviceName: 'Haircut',
    notes: 'First time client',
    createdAt: '2025-12-10T10:00:00Z',
  },
  {
    id: '2',
    clientFirstName: 'Jane',
    clientLastName: 'Smith',
    clientEmail: 'jane.smith@example.com',
    clientPhone: '+1 555-0102',
    appointmentDate: '2025-12-16',
    startTime: '14:00',
    endTime: '15:30',
    status: 'pending',
    serviceName: 'Massage Therapy',
    notes: 'Prefers afternoon appointments',
    createdAt: '2025-12-11T09:30:00Z',
  },
  {
    id: '3',
    clientFirstName: 'Bob',
    clientLastName: 'Johnson',
    clientEmail: 'bob.j@example.com',
    clientPhone: '+1 555-0103',
    appointmentDate: '2025-12-18',
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed',
    serviceName: 'Consultation',
    notes: 'Bring previous medical records',
    createdAt: '2025-12-11T14:20:00Z',
  },
  {
    id: '4',
    clientFirstName: 'Alice',
    clientLastName: 'Williams',
    clientEmail: 'alice.w@example.com',
    clientPhone: '+1 555-0104',
    appointmentDate: '2025-12-05',
    startTime: '11:00',
    endTime: '12:00',
    status: 'completed',
    serviceName: 'Dental Cleaning',
    notes: 'Regular checkup',
    createdAt: '2025-12-01T08:15:00Z',
  },
  {
    id: '5',
    clientFirstName: 'Charlie',
    clientLastName: 'Brown',
    clientEmail: 'charlie.b@example.com',
    clientPhone: '+1 555-0105',
    appointmentDate: '2025-12-08',
    startTime: '15:00',
    endTime: '16:00',
    status: 'cancelled',
    serviceName: 'Personal Training',
    notes: 'Client cancelled due to schedule conflict',
    createdAt: '2025-12-03T16:45:00Z',
  },
];

const Appointments = () => {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState(mockAppointments);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter appointments based on status
  useEffect(() => {
    let filtered = appointments;

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (activeFilter) {
          case 'upcoming':
            return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
          case 'past':
            return aptDate < today || apt.status === 'completed';
          case 'cancelled':
            return apt.status === 'cancelled';
          case 'pending':
            return apt.status === 'pending';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((apt) =>
        apt.clientFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.clientLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [activeFilter, searchQuery, appointments]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: { variant: 'success', label: 'Confirmed', icon: CheckCircle },
      pending: { variant: 'warning', label: 'Pending', icon: AlertCircle },
      cancelled: { variant: 'destructive', label: 'Cancelled', icon: XCircle },
      completed: { variant: 'secondary', label: 'Completed', icon: CheckCircle },
      no_show: { variant: 'outline', label: 'No Show', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: appointments.length },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
      }).length
    },
    { key: 'pending', label: 'Pending', count: appointments.filter(apt => apt.status === 'pending').length },
    {
      key: 'past',
      label: 'Past',
      count: appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return aptDate < today || apt.status === 'completed';
      }).length
    },
    { key: 'cancelled', label: 'Cancelled', count: appointments.filter(apt => apt.status === 'cancelled').length },
  ];

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
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

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
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
                          <p className="font-medium">{appointment.serviceName}</p>
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
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
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
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of{' '}
                    {filteredAppointments.length} appointments
                  </p>
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
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;
