import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const features = [
  'Unlimited appointments',
  'Unlimited services',
  'Employee management',
  'Email notifications',
  'Real-time analytics',
  'QR code generation',
  'Custom booking page',
  'Client management',
  'Calendar integrations',
  'Priority support',
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our beta program and enjoy all features completely free
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary shadow-xl relative overflow-hidden">
            {/* Beta Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 hover:bg-green-600">
                <Sparkles className="h-3 w-3 mr-1" />
                Beta Launch
              </Badge>
            </div>

            <CardHeader className="text-center pb-8 pt-12">
              <CardTitle className="text-3xl mb-2">Free Forever</CardTitle>
              <CardDescription className="text-lg">During beta period</CardDescription>

              <div className="mt-6">
                <div className="text-5xl font-bold text-primary">$0</div>
                <p className="text-sm text-muted-foreground mt-2">No credit card required</p>
              </div>
            </CardHeader>

            <CardContent className="px-8">
              <div className="space-y-4">
                <p className="font-semibold text-center mb-6">Everything included:</p>
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="px-8 pb-8 pt-6">
              <Link to="/register" className="w-full">
                <Button size="lg" className="w-full text-lg">
                  Start Free Today
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Trust Message */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Join 1,000+ businesses already using TimeSnap. Setup takes less than 2 minutes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
