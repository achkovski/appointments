import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* BETA Badge */}
        <div className="mb-6 flex justify-center">
          <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            🎉 BETA - All Features FREE!
          </Badge>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Ready to Transform Your Booking Process?
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Join <strong>1,000+ businesses</strong> using TimeSnap to streamline appointments, reduce no-shows by 50%, and grow their business.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-7 w-full sm:w-auto shadow-2xl hover:shadow-xl transition-all hover:scale-105">
              Start Free Today - No Credit Card
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-white font-medium">Free during beta</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-white font-medium">No credit card required</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-white font-medium">Setup in 2 minutes</span>
          </div>
        </div>

        {/* Additional trust element */}
        <div className="mt-10 pt-8 border-t border-white/20">
          <p className="text-white/80 text-sm">
            🔒 Secure • 🚀 Fast Setup • ⭐ Trusted by 1,000+ Businesses
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
