import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, User, Phone, AlertCircle, Calendar, Check, Quote, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/seo/SEOHead';
import { Badge } from '../components/ui/badge';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const { confirmPassword: _unused, ...registerData } = formData;
      await register(registerData);
      navigate('/setup');
    } catch (err) {
      // Extract detailed error message from backend
      let errorMessage = 'Failed to create account. Please try again.';

      if (err.response?.data) {
        // Check for validation errors array
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map(e => e.message || e.msg).join(', ');
        }
        // Check for single error message
        else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        // Check for error string
        else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }

      // Sanitize error message - never display database/system errors
      const sensitivePatterns = [
        /database/i,
        /connection/i,
        /sql/i,
        /query/i,
        /errno/i,
        /econnrefused/i,
        /timeout/i,
        /postgresql/i,
        /mysql/i,
        /mongodb/i,
      ];

      const hasSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(errorMessage));
      if (hasSensitiveInfo) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <>
      <SEOHead
        title="Sign Up Free - TimeSnap.io"
        description="Create your free TimeSnap account. Join 1,000+ businesses managing appointments smarter. Setup in 2 minutes, no credit card required."
        keywords="sign up free, create account, free appointment booking, business registration, timesnap signup"
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        {/* Two-column layout for desktop */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left Column - Benefits Sidebar (40%) */}
          <div className="hidden lg:block lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">TimeSnap.io</h2>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-base mb-4 animate-pulse">
                <Sparkles className="h-4 w-4 mr-2" />
                🎉 BETA Launch - 100% FREE!
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Join 1,000+ businesses managing appointments smarter
              </h3>
              <p className="text-muted-foreground">
                All premium features included • No credit card required
              </p>
            </div>

            {/* Benefits Checklist */}
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-bold">100% FREE during BETA launch</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Setup in under 2 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Unlimited appointments & services</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Email & SMS notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Real-time analytics & reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Employee management</span>
              </div>
            </div>

            {/* Testimonial */}
            <Card className="border-2 border-primary/20 bg-white/50">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-3" />
                <p className="text-gray-700 mb-4 italic">
                  "TimeSnap cut our booking time in half. Setup was incredibly easy!"
                </p>
                <div>
                  <p className="font-semibold">Maria S.</p>
                  <p className="text-sm text-muted-foreground">Salon Owner</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Registration Form (60%) */}
          <div className="lg:col-span-3">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calendar className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold">TimeSnap.io</h1>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-base mb-3 animate-pulse">
                <Sparkles className="h-4 w-4 mr-2" />
                🎉 BETA Launch - 100% FREE!
              </Badge>
              <p className="text-muted-foreground">
                Create your account and start managing appointments
              </p>
              <p className="text-sm text-primary font-medium mt-2">
                All premium features included • No credit card required
              </p>
            </div>

            {/* Register Card */}
            <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 border border-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 chars, upper, lower, number, special"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 TimeSnap.io. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
