import { UserPlus, Settings, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Create Your Business',
    description: 'Sign up in 2 minutes. Add your business name, services, and basic information. No credit card required.',
  },
  {
    number: 2,
    icon: Settings,
    title: 'Customize Schedule',
    description: 'Define your working hours, breaks, and availability. Set up services, pricing, and booking rules.',
  },
  {
    number: 3,
    icon: Share2,
    title: 'Share Your Link',
    description: 'Get your unique booking page and QR code. Share it with clients and start receiving appointments instantly.',
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From signup to your first booking in minutes, not hours
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -z-10" style={{ left: '16.67%', right: '16.67%' }} />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="relative border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-white group"
              >
                <CardHeader>
                  {/* Step Number */}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>

                  <CardTitle className="text-xl text-center group-hover:text-primary transition-colors">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-700 mb-2">
            <strong>Ready to get started?</strong> It's completely free during our beta period!
          </p>
          <p className="text-sm text-muted-foreground">
            No technical skills required • No credit card needed • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
