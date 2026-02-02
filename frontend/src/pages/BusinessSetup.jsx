import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { createBusiness } from '../services/businessService';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

const BUSINESS_TYPES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'fitness', label: 'Fitness & Sports' },
  { value: 'education', label: 'Education & Training' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'other', label: 'Other' },
];

const CAPACITY_MODES = [
  { value: 'single', label: 'Single Client', description: 'One appointment at a time' },
  { value: 'multiple', label: 'Multiple Clients', description: 'Multiple appointments at once' },
];

const BusinessSetup = () => {
  const navigate = useNavigate();
  const { setBusinessId } = useBusiness();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'other',
    description: '',
    phone: '',
    email: '',
    address: '',
    capacityMode: 'single',
    defaultCapacity: 1,
  });
  const [errors, setErrors] = useState({});

  // Redirect to dashboard if user has already completed setup
  useEffect(() => {
    if (user?.hasCompletedSetup) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await createBusiness(formData);
      const business = response.business || response;

      // Set the business ID in context and localStorage
      await setBusinessId(business.id);

      // Update user in auth context to reflect hasCompletedSetup = true
      if (user) {
        updateUser({ ...user, hasCompletedSetup: true, businessId: business.id });
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating business:', err);
      setError(err.response?.data?.message || 'Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Setup Your Business</h1>
          </div>
          <p className="text-muted-foreground">
            Let's get started by setting up your business profile
          </p>
        </div>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Business Information</CardTitle>
            <CardDescription>
              This information will be visible to your clients when they book appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 border border-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="My Business"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                />
                {errors.businessName && (
                  <p className="text-xs text-destructive">{errors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  rows="3"
                  placeholder="Brief description of your business"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Capacity Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CAPACITY_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        handleChange('capacityMode', mode.value);
                        handleChange('defaultCapacity', mode.value === 'single' ? 1 : 10);
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
                        formData.capacityMode === mode.value
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex-shrink-0 ${
                          formData.capacityMode === mode.value ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          <CheckCircle className={`h-5 w-5 ${
                            formData.capacityMode === mode.value ? 'fill-primary text-primary-foreground' : ''
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{mode.label}</p>
                          <p className="text-sm text-muted-foreground">{mode.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.capacityMode === 'multiple' && (
                <div className="space-y-2">
                  <Label htmlFor="defaultCapacity">Default Capacity</Label>
                  <Input
                    id="defaultCapacity"
                    type="number"
                    min="1"
                    value={formData.defaultCapacity}
                    onChange={(e) => handleChange('defaultCapacity', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of clients that can book the same time slot
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating Business...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSetup;
