import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Transform Your Booking Process?
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of businesses using TimeSnap to streamline appointments, reduce no-shows, and grow their business.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 w-full sm:w-auto">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center text-sm text-white/80">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span>Free during beta</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span>Setup in 2 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
