import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from './ui/button';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">
                  We use cookies 🍪
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We use cookies to improve your experience on our site and to show you relevant content.
                  By continuing to use our site, you accept our use of cookies.{' '}
                  <Link to="/privacy" className="text-primary-foreground underline hover:text-white transition-colors">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleDecline}
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-none text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
