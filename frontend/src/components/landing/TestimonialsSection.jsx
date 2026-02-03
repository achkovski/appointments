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
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-white"
            >
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Quote className="h-10 w-10 text-primary/30" />
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {/* Avatar placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary font-medium">{testimonial.business}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats - Enhanced with animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-xl bg-white border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <p className="text-5xl font-bold text-primary mb-3">1,000+</p>
            <p className="text-gray-600 font-medium">Businesses Using TimeSnap</p>
          </div>
          <div className="p-6 rounded-xl bg-white border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <p className="text-5xl font-bold text-primary mb-3">50,000+</p>
            <p className="text-gray-600 font-medium">Appointments Booked</p>
          </div>
          <div className="p-6 rounded-xl bg-white border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <p className="text-5xl font-bold text-primary mb-3">4.8/5</p>
            <p className="text-gray-600 font-medium">Average Rating</p>
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-xl ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
