import PublicLayout from '../components/layout/PublicLayout';
import SEOHead from '../components/seo/SEOHead';
import HeroSection from '../components/landing/HeroSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';

const Landing = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="TimeSnap.io - Appointment Booking Made Simple | BETA - Free for All"
        description="Free appointment scheduling platform for businesses. Automated confirmations, reminders, and 24/7 online booking. Perfect for salons, clinics, consultants, and more. Currently in BETA - all features FREE!"
        keywords="appointment booking, scheduling software, online booking system, appointment scheduler, business calendar, booking app, client scheduling, salon booking, clinic appointments, free booking software, beta launch"
      />

      <HeroSection />
      <UseCasesSection />
      <FeaturesSection />
      <BenefitsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Landing;
