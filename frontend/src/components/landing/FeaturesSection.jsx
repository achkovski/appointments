import { Calendar, Clock, Bell, Users, BarChart, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar Management',
    description: 'Customize working hours, breaks, and capacity limits. Set exceptions for holidays and special events with ease.',
  },
  {
    icon: Clock,
    title: 'Instant Client Booking',
    description: '24/7 online booking with automatic confirmations. Clients schedule appointments anytime, from anywhere.',
  },
  {
    icon: Bell,
    title: 'Email Notifications',
    description: 'Automated reminders and confirmations keep everyone informed. Reduce no-shows with timely email alerts.',
  },
  {
    icon: Users,
    title: 'Employee Management',
    description: 'Assign services to staff and track individual schedules. Perfect for businesses with multiple service providers.',
  },
  {
    icon: BarChart,
    title: 'Real-Time Analytics',
    description: 'Understand booking patterns, peak hours, and cancellation rates. Make data-driven decisions for your business.',
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Share your booking page with a scannable QR code. Perfect for print materials and in-store displays.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Appointments
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to streamline your booking process and delight your clients
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-primary/20 group"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
