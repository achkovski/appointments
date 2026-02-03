import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, CheckCircle, Mail, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const HeroSection = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-primary/5 via-background to-primary/10 py-20 md:py-32 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* BETA Badge */}
            <div className="mb-6 flex justify-center lg:justify-start">
              <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm animate-bounce">
                <Sparkles className="h-4 w-4 mr-2" />
                🎉 Currently in BETA - All Features FREE!
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Appointment Booking
              <span className="text-primary"> Made Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              The all-in-one scheduling platform trusted by <strong>1,000+ businesses</strong>.
              Automate bookings, reduce no-shows by 50%, and focus on what matters.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 w-full sm:w-auto hover:bg-primary/5 transition-all"
                onClick={() => scrollToSection('how-it-works')}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-gray-700 font-medium">Free during beta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-gray-700 font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.4s' }}>
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-gray-700 font-medium">Setup in 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column - Animated Booking Flow */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Main calendar card */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border-2 border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                  <Badge variant="outline" className="text-xs">Live Demo</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Book Appointment</h3>
                <p className="text-sm text-muted-foreground mb-4">Select your preferred time</p>

                {/* Animated booking steps */}
                <div className="space-y-3">
                  {/* Step 1 - Select Service */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">1. Service Selected</p>
                      <p className="text-xs text-muted-foreground">Haircut & Styling</p>
                    </div>
                  </div>

                  {/* Step 2 - Select Time */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin-slow" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">2. Time Selected</p>
                      <p className="text-xs text-muted-foreground">Today at 3:00 PM</p>
                    </div>
                  </div>

                  {/* Step 3 - Confirmation */}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 animate-fade-in" style={{ animationDelay: '1s' }}>
                    <Mail className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">3. Confirmation Sent</p>
                      <p className="text-xs text-muted-foreground">Check your email</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stats cards with animations */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border-2 border-primary/20 animate-float">
                <p className="text-xs text-muted-foreground">Appointments booked</p>
                <p className="text-2xl font-bold text-primary">50,000+</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border-2 border-primary/20 animate-float" style={{ animationDelay: '1s' }}>
                <p className="text-xs text-muted-foreground">Happy Businesses</p>
                <p className="text-2xl font-bold text-primary">1,000+</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
