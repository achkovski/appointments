import { Quote } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const testimonials = [
  {
    quote: "TimeSnap cut our booking time in half. Our clients love how easy it is to schedule appointments online.",
    author: "Maria S.",
    role: "Salon Owner",
    business: "Bella Beauty Salon",
  },
  {
    quote: "No more double bookings or phone tag. This system has completely transformed how we manage our dental practice.",
    author: "Dr. James Chen",
    role: "Dentist",
    business: "Chen Family Dental",
  },
  {
    quote: "Setup was incredibly simple. Within minutes, I was sharing my booking link with clients. Best decision for my coaching business.",
    author: "Sarah Miller",
    role: "Life Coach",
    business: "Mindful Coaching",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Businesses Like Yours
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what our users have to say about TimeSnap
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-primary">{testimonial.business}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-primary mb-2">1,000+</p>
            <p className="text-gray-600">Businesses Using TimeSnap</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary mb-2">50,000+</p>
            <p className="text-gray-600">Appointments Booked</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary mb-2">4.8/5</p>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
