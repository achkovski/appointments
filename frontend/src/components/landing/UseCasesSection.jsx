import { Scissors, Stethoscope, Dumbbell, Briefcase, Users, Utensils } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const useCases = [
  {
    icon: Scissors,
    title: 'Salons & Spas',
    description: 'Manage stylist schedules, beauty treatments, and client appointments seamlessly.',
    stats: '300+ salons',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
  },
  {
    icon: Stethoscope,
    title: 'Medical & Dental',
    description: 'Schedule patient appointments, manage multiple practitioners, and reduce no-shows.',
    stats: '200+ clinics',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Dumbbell,
    title: 'Fitness & Wellness',
    description: 'Book personal training sessions, group classes, and wellness consultations.',
    stats: '150+ trainers',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Briefcase,
    title: 'Consultants & Coaches',
    description: 'Schedule client meetings, coaching sessions, and business consultations.',
    stats: '250+ consultants',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Users,
    title: 'Professional Services',
    description: 'Manage appointments for legal, financial, real estate, and other professional services.',
    stats: '100+ professionals',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Utensils,
    title: 'Restaurants & Hospitality',
    description: 'Handle table reservations, event bookings, and manage dining capacity.',
    stats: '50+ restaurants',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
  },
];

const UseCasesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for Every Industry
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're a solo entrepreneur or a multi-location business, TimeSnap adapts to your unique needs
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              >
                <CardHeader>
                  <div className={`w-14 h-14 ${useCase.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 text-${useCase.color.replace('bg-', '')}`} style={{ color: useCase.color.replace('bg-', '') }} />
                  </div>
                  <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                  <div className="inline-block">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {useCase.stats}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {useCase.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-700 mb-4">
            Don't see your industry? <strong>TimeSnap works for any appointment-based business.</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            From dog groomers to marketing agencies, we've got you covered.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
