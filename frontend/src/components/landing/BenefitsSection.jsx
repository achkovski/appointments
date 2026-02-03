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
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
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
              className="flex flex-col md:flex-row gap-6 items-center justify-between"
            >
              {/* Problem */}
              <div className="flex-1 bg-white p-6 rounded-xl border-2 border-red-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <X className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 font-medium">{benefit.problem}</p>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="text-primary text-3xl font-bold md:block hidden">→</div>
              <div className="text-primary text-3xl font-bold md:hidden rotate-90">↓</div>

              {/* Solution */}
              <div className="flex-1 bg-gradient-to-br from-primary to-primary/80 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 transform hover:scale-105">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-white font-semibold">{benefit.solution}</p>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="text-green-500 text-3xl font-bold md:block hidden">→</div>
              <div className="text-green-500 text-3xl font-bold md:hidden rotate-90">↓</div>

              {/* Outcome */}
              <div className="flex-1 bg-white p-6 rounded-xl border-2 border-green-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
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
