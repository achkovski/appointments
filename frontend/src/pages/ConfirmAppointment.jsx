import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { confirmAppointment } from '../services/publicBookingService';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ConfirmAppointment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'success', 'error', 'invalid'
  const [message, setMessage] = useState('');
  const [appointmentData, setAppointmentData] = useState(null);

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setStatus('invalid');
        setMessage('Invalid confirmation link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await confirmAppointment(token);

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Your appointment has been confirmed successfully!');
          setAppointmentData(response.data);
        } else {
          setStatus('error');
          setMessage(response.message || 'Failed to confirm appointment');
        }
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          'Failed to confirm appointment. The link may have expired or is invalid.'
        );
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
            {status === 'invalid' && (
              <AlertCircle className="h-16 w-16 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-center">
            {status === 'success' && 'Appointment Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
            {status === 'invalid' && 'Invalid Link'}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && appointmentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold">Appointment Details</h3>
              {appointmentData.serviceName && (
                <p>
                  <span className="font-medium">Service:</span> {appointmentData.serviceName}
                </p>
              )}
              {appointmentData.appointmentDate && (
                <p>
                  <span className="font-medium">Date:</span> {appointmentData.appointmentDate}
                </p>
              )}
              {appointmentData.startTime && appointmentData.endTime && (
                <p>
                  <span className="font-medium">Time:</span> {appointmentData.startTime} -{' '}
                  {appointmentData.endTime}
                </p>
              )}
              {appointmentData.businessName && (
                <p>
                  <span className="font-medium">Business:</span> {appointmentData.businessName}
                </p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <p className="font-medium mb-1">What's next?</p>
              <p>
                You will receive a reminder email before your appointment. If you need to cancel
                or reschedule, please contact the business directly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p className="font-medium mb-1">What can you do?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check if you already confirmed this appointment</li>
                <li>Request a new confirmation link from the business</li>
                <li>Contact the business directly to confirm your booking</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
            {status === 'success' && appointmentData?.businessSlug && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/book/${appointmentData.businessSlug}`)}
              >
                Book Another
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmAppointment;
