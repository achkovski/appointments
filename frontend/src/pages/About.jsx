import { Link } from 'react-router-dom';
import { Target, Users, Lightbulb, ArrowRight } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import SEOHead from '../components/seo/SEOHead';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const About = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="About TimeSnap.io - Modern Appointment Booking Solution"
        description="Learn about TimeSnap.io, our mission to modernize appointment booking for businesses, and how we're helping thousands streamline their scheduling."
        keywords="about timesnap, appointment booking company, scheduling software startup, booking platform mission"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About TimeSnap.io
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            We're on a mission to modernize appointment booking for every business, making scheduling simple, automated, and accessible to all.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  To eliminate the chaos of manual booking by providing a modern, automated scheduling platform that works for businesses of all sizes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  A world where every business, from solo practitioners to large clinics, can offer seamless online booking without complexity or cost barriers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Simplicity, reliability, and customer success. We build tools that just work, so you can focus on serving your clients.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
            The Problem We're Solving
          </h2>
          <div className="space-y-4 text-gray-700">
            <p className="text-lg">
              For decades, businesses have relied on phone calls, paper calendars, and manual tracking to manage appointments. This leads to:
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span><strong>Endless phone tag</strong> with clients trying to schedule during business hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span><strong>Double bookings</strong> from manual calendar management errors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span><strong>High no-show rates</strong> without automated reminders</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span><strong>Missed opportunities</strong> when clients can't book outside business hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span><strong>Time wasted</strong> managing schedules instead of serving clients</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Our Solution Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
            Our Solution
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p>
              TimeSnap.io is an all-in-one digital appointment booking platform designed for simplicity and reliability. We provide:
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>24/7 online booking</strong> so clients can schedule anytime, anywhere</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Automatic confirmations and reminders</strong> that reduce no-shows</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Smart calendar management</strong> that prevents double bookings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Employee scheduling</strong> for businesses with multiple service providers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Real-time analytics</strong> to understand your booking patterns</span>
              </li>
            </ul>
            <p className="pt-4">
              Best of all, we're currently in beta and <strong>completely free to use</strong>. We believe every business deserves access to professional booking tools.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
            Who We Serve
          </h2>
          <p className="text-lg text-gray-700 text-center mb-8">
            TimeSnap.io works for any business that relies on appointments:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            {['Salons & Spas', 'Medical Clinics', 'Dental Offices', 'Fitness Trainers', 'Consultants & Coaches', 'Restaurants', 'Marketing Agencies', 'Therapists', 'And Many More'].map((industry, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-primary transition-colors">
                <p className="font-medium text-gray-700">{industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Us?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Be part of the movement to modernize appointment booking. Sign up free today.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
