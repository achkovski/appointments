import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
