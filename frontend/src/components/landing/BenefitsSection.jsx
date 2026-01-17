import { X, Check } from 'lucide-react';

const benefits = [
  {
    problem: 'Tired of playing phone tag with clients?',
    solution: 'Clients book 24/7 online without phone calls',
    outcome: 'Focus on your business, not your phone',
  },
  {
    problem: 'Losing appointments to double bookings?',
    solution: 'Automatic slot management prevents overlaps',
    outcome: 'Never double-book or lose track again',
  },
  {
    problem: 'Struggling with no-shows and cancellations?',
    solution: 'Email and SMS reminders keep clients engaged',
    outcome: 'Reduce no-shows by up to 50%',
  },
  {
    problem: 'Missing out on after-hours booking opportunities?',
    solution: 'Clients can book anytime, even at 2 AM',
    outcome: 'Capture bookings while you sleep',
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop Wasting Time. Start Growing Your Business.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how TimeSnap transforms common booking headaches into seamless experiences
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
            >
              {/* Problem */}
              <div className="bg-white p-6 rounded-lg border-2 border-red-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 font-medium">{benefit.problem}</p>
                </div>
              </div>

              {/* Solution */}
              <div className="bg-primary p-6 rounded-lg shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-white font-semibold">{benefit.solution}</p>
                </div>
              </div>

              {/* Outcome */}
              <div className="bg-white p-6 rounded-lg border-2 border-green-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 font-medium">{benefit.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
