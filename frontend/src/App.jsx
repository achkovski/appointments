import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Appointments from './pages/dashboard/Appointments';
import AppointmentDetail from './pages/dashboard/AppointmentDetail';
import Services from './pages/dashboard/Services';
import Availability from './pages/dashboard/Availability';
import Analytics from './pages/dashboard/Analytics';
import BusinessProfile from './pages/dashboard/BusinessProfile';
import Settings from './pages/dashboard/Settings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="availability" element={<Availability />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="business" element={<BusinessProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
