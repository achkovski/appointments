import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import RootRedirect from './components/RootRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import BusinessSetup from './pages/BusinessSetup';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Appointments from './pages/dashboard/Appointments';
import AppointmentDetail from './pages/dashboard/AppointmentDetail';
import Services from './pages/dashboard/Services';
import Employees from './pages/dashboard/Employees';
import Availability from './pages/dashboard/Availability';
import Analytics from './pages/dashboard/Analytics';
import BusinessProfile from './pages/dashboard/BusinessProfile';
import Settings from './pages/dashboard/Settings';
import BookingPage from './pages/BookingPage';
import ConfirmAppointment from './pages/ConfirmAppointment';
import NotificationListener from './components/notifications/NotificationListener';
import { Toaster } from './components/ui/toaster';

// Lazy load landing pages for performance
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root - Auth-based routing */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public marketing pages */}
          <Route
            path="/about"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Contact />
              </Suspense>
            }
          />

          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public booking routes */}
          <Route path="/book/:slug" element={<BookingPage />} />
          <Route path="/confirm-appointment" element={<ConfirmAppointment />} />

          {/* Protected business setup */}
          <Route
            path="/setup"
            element={
              <PrivateRoute>
                <BusinessProvider>
                  <BusinessSetup />
                </BusinessProvider>
              </PrivateRoute>
            }
          />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <BusinessProvider>
                  <SocketProvider>
                    <NotificationListener />
                    <DashboardLayout />
                  </SocketProvider>
                </BusinessProvider>
              </PrivateRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="services" element={<Services />} />
            <Route path="employees" element={<Employees />} />
            <Route path="availability" element={<Availability />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="business" element={<BusinessProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
