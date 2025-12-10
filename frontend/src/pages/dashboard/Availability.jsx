import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const Availability = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability</h2>
        <p className="text-muted-foreground">
          Configure your working hours and availability
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>
              Set your standard working hours for each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Working hours configuration coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Special Dates</CardTitle>
            <CardDescription>
              Mark holidays and exceptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Special dates configuration coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Break Times</CardTitle>
            <CardDescription>
              Configure lunch breaks and rest periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Break times configuration coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Settings</CardTitle>
            <CardDescription>
              Set appointment capacity limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Capacity settings coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Availability;
