import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  QrCode,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { toastSuccess, toastError } from '../../utils/toastHelpers';
import { updateBusiness, generateQRCode } from '../../services/businessService';

const CAPACITY_MODES = [
  { value: 'SINGLE', label: 'Single', description: 'One client per time slot' },
  { value: 'MULTIPLE', label: 'Multiple', description: 'Multiple concurrent clients' },
];

const BusinessProfile = () => {
  const { business, loading: businessLoading, updateBusiness: updateBusinessContext } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    businessType: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    capacityMode: 'SINGLE',
    defaultCapacity: 1,
  });

  const [formErrors, setFormErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        businessName: business.businessName || '',
        description: business.description || '',
        businessType: business.businessType || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        website: business.website || '',
        capacityMode: business.capacityMode || 'SINGLE',
        defaultCapacity: business.defaultCapacity || 1,
      });
      setQrCodeUrl(business.qrCodeUrl);
    }
  }, [business]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.businessName?.trim()) {
      errors.businessName = 'Business name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Website must start with http:// or https://';
    }

    if (formData.capacityMode === 'MULTIPLE' && (!formData.defaultCapacity || formData.defaultCapacity < 1)) {
      errors.defaultCapacity = 'Default capacity must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const updateData = {
        businessName: formData.businessName,
        description: formData.description || null,
        businessType: formData.businessType || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        website: formData.website || null,
        capacityMode: formData.capacityMode,
        defaultCapacity: parseInt(formData.defaultCapacity),
      };

      const response = await updateBusiness(business.id, updateData);
      await updateBusinessContext(response.business || response);
      setHasChanges(false);
      toastSuccess("Success!", "Business profile updated successfully");
    } catch (err) {
      console.error('Error updating business:', err);
      setError(err.response?.data?.message || 'Failed to update business profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setQrLoading(true);
      const response = await generateQRCode(business.id);
      setQrCodeUrl(response.qrCodeUrl || response.qrCode);
      await updateBusinessContext({ ...business, qrCodeUrl: response.qrCodeUrl || response.qrCode });
      toastSuccess("Success!", "QR Code generated successfully");
    } catch (err) {
      console.error('Error generating QR code:', err);
      toastError("Error", err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBookingUrl = () => {
    if (!business?.slug) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/book/${business.slug}`;
  };

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading business profile...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Business Not Found</h3>
          <p className="text-sm text-muted-foreground">Unable to load business information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Profile</h2>
          <p className="text-muted-foreground">
            Manage your business information and public booking page
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Update your business details visible to clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Enter your business name"
              />
              {formErrors.businessName && (
                <p className="text-sm text-destructive">{formErrors.businessName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business and services..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This will be shown to clients on your booking page
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                placeholder="e.g., Salon, Clinic, Restaurant, Consulting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacityMode">Capacity Mode</Label>
              <select
                id="capacityMode"
                value={formData.capacityMode}
                onChange={(e) => handleInputChange('capacityMode', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CAPACITY_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label} - {mode.description}
                  </option>
                ))}
              </select>
            </div>

            {formData.capacityMode === 'MULTIPLE' && (
              <div className="space-y-2">
                <Label htmlFor="defaultCapacity">Default Capacity</Label>
                <Input
                  id="defaultCapacity"
                  type="number"
                  min="1"
                  value={formData.defaultCapacity}
                  onChange={(e) => handleInputChange('defaultCapacity', e.target.value)}
                  placeholder="Number of concurrent clients"
                />
                {formErrors.defaultCapacity && (
                  <p className="text-sm text-destructive">{formErrors.defaultCapacity}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum number of clients that can be served at the same time
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Phone, email, and address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@business.com"
                    className="pl-10"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                  rows={2}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.yourbusiness.com"
                  className="pl-10"
                />
              </div>
              {formErrors.website && (
                <p className="text-sm text-destructive">{formErrors.website}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Booking Page
            </CardTitle>
            <CardDescription>
              Your unique booking page URL and QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Booking Page URL</Label>
              <div className="flex gap-2">
                <Input
                  value={getBookingUrl()}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(getBookingUrl())}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(getBookingUrl(), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with clients to let them book appointments
              </p>
            </div>

            <div className="space-y-2">
              <Label>QR Code</Label>
              {qrCodeUrl ? (
                <div className="flex items-start gap-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <img
                      src={qrCodeUrl}
                      alt="Booking Page QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Clients can scan this QR code to quickly access your booking page
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateQR}
                      disabled={qrLoading}
                    >
                      {qrLoading ? 'Regenerating...' : 'Regenerate QR Code'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No QR code generated yet
                  </p>
                  <Button
                    onClick={handleGenerateQR}
                    disabled={qrLoading}
                    size="sm"
                  >
                    {qrLoading ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessProfile;
