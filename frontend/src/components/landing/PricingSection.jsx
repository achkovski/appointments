import { Link } from 'react-router-dom';
import { Check, Sparkles, Star, Crown, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const pricingPlans = [
  {
    name: 'Basic',
    subtitle: 'Best for small businesses',
    icon: Star,
    originalPrice: '899',
    features: [
      '1 employee',
      'Unlimited services',
      'Limited monthly appointments (100)',
      '1 business location',
      'All core booking features',
      'Email notifications',
      'QR code generation',
      'Custom booking page',
    ],
    isPopular: false,
  },
  {
    name: 'Professional',
    subtitle: 'Best for established businesses',
    icon: Crown,
    originalPrice: '1,499',
    features: [
      '3 to 5 employees',
      'Unlimited services',
      'Unlimited appointments',
      '1 business location',
      'All core booking features',
      'Access to analytics and reports',
      'Email & SMS notifications',
      'Priority support',
      'QR code generation',
    ],
    isPopular: true,
  },
  {
    name: 'Business',
    subtitle: 'Big businesses with multiple locations',
    icon: Building2,
    originalPrice: '3,999',
    features: [
      'Unlimited employees',
      'Unlimited services',
      'Unlimited appointments',
      'Unlimited locations',
      'All core booking features',
      'Access to analytics and reports',
      'Email & SMS notifications',
      'Priority support',
      'Dedicated account manager',
      'Custom integrations',
    ],
    isPopular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-green-500 hover:bg-green-600 text-white mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            🎉 BETA Launch - Everything FREE!
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            All plans are currently <strong>100% FREE</strong> during our beta period. Lock in your account now!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                className={`relative border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.isPopular
                    ? 'border-primary shadow-xl scale-105'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.subtitle}</CardDescription>

                  {/* Pricing */}
                  <div className="mt-6">
                    {/* Original Price - Crossed Out */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl text-gray-400 line-through">
                        {plan.originalPrice} ден
                      </span>
                    </div>
                    {/* FREE Badge */}
                    <div className="mb-2">
                      <Badge className="bg-green-500 hover:bg-green-600 text-white text-lg px-6 py-2">
                        FREE
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      During BETA • No credit card required
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="px-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="px-6 pb-8 pt-6">
                  <Link to="/register" className="w-full">
                    <Button
                      size="lg"
                      className="w-full"
                      variant={plan.isPopular ? 'default' : 'outline'}
                    >
                      Get Started Free
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Trust Message */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Join 1,000+ businesses already using TimeSnap. Setup takes less than 2 minutes.
          </p>
          <p className="text-xs text-muted-foreground">
            * Prices shown will apply after beta period ends. Early users will receive special discounts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
