import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

const Appointments = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="flex gap-2">
        <Button variant="outline">All</Button>
        <Button variant="ghost">Upcoming</Button>
        <Button variant="ghost">Past</Button>
        <Button variant="ghost">Cancelled</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
          <CardDescription>
            View and manage your appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No appointments found. Create your first appointment to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;
