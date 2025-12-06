# Appointments Frontend

React frontend application for the Appointments Management System, built with Vite.

## Tech Stack

- React 19
- Vite
- React Router (to be added)
- Axios (to be added)
- Context API for state management
- CSS/Tailwind/Material-UI (TBD)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend API URL

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Application Features

### For Business Users

#### Authentication Pages
- **Login** - Business user login with JWT
- **Register** - New business user registration
- **Email Verification** - Verify email after registration
- **Password Reset** - Request and reset password

#### Business Dashboard
- **Dashboard Home** - Overview of today's appointments and quick stats
- **Appointments List** - View all appointments (upcoming, past, cancelled)
- **Appointment Details** - Detailed view with client info and notes
- **Calendar View** - Daily, weekly, monthly calendar views
- **Manual Booking** - Add offline/phone bookings manually
- **Analytics** - Booking patterns, popular times, trends

#### Business Management
- **Business Profile** - Edit business information
- **Availability Settings** - Configure working hours, breaks, capacity
- **Special Dates** - Manage holidays, exceptions, custom hours
- **QR Code & Link** - Generate and download booking page QR code
- **Notification Settings** - Configure email preferences and reminders

### For Clients (Public Pages)

#### Public Booking Flow
- **Business Page** (`/book/:slug`) - Public booking page with calendar
- **Time Slot Selector** - Choose available date and time
- **Booking Form** - Enter personal information (name, email, phone)
- **Email Confirmation** - Verify booking via email (if required)
- **Booking Confirmation** - Success page with appointment details

## Project Structure

```
frontend/
├── src/
│   ├── assets/        # Images, fonts, static files
│   │   └── logo.svg
│   ├── components/    # Reusable UI components
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── dashboard/
│   │   │   ├── AppointmentCard.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── booking/
│   │   │   ├── DatePicker.jsx
│   │   │   ├── TimeSlotSelector.jsx
│   │   │   └── BookingForm.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loader.jsx
│   │   └── analytics/
│   │       ├── ChartCard.jsx
│   │       └── StatsTable.jsx
│   ├── pages/         # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── AppointmentsPage.jsx
│   │   │   ├── AppointmentDetailsPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── ManualBookingPage.jsx
│   │   ├── business/
│   │   │   ├── BusinessProfilePage.jsx
│   │   │   ├── AvailabilityPage.jsx
│   │   │   ├── SpecialDatesPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── public/
│   │   │   ├── PublicBookingPage.jsx
│   │   │   ├── BookingSuccessPage.jsx
│   │   │   └── EmailConfirmationPage.jsx
│   │   ├── HomePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── services/      # API service calls
│   │   ├── api.js     # Axios instance and interceptors
│   │   ├── authService.js
│   │   ├── businessService.js
│   │   ├── appointmentService.js
│   │   ├── analyticsService.js
│   │   └── publicService.js
│   ├── context/       # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── BusinessContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/         # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useAppointments.js
│   │   ├── useAvailability.js
│   │   └── useDebounce.js
│   ├── utils/         # Utility functions
│   │   ├── dateHelpers.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   ├── App.jsx        # Main App component with routing
│   ├── App.css        # App styles
│   ├── index.css      # Global styles
│   └── main.jsx       # Entry point
├── public/            # Static assets
├── .env.example       # Environment variables template
├── index.html         # HTML entry point
├── vite.config.js     # Vite configuration
└── package.json
```

## Key User Flows

### Business User Flow
1. **Registration**: Sign up → Verify email → Login
2. **Business Setup**: Create business profile → Configure availability → Generate booking link
3. **Daily Operations**: View appointments → Confirm/Cancel → Add notes → Manual bookings
4. **Analysis**: Check analytics → Understand booking patterns

### Client Flow
1. **Discovery**: Receive booking link/QR code from business
2. **Booking**: Visit booking page → Select date/time → Enter info → Confirm
3. **Verification**: Confirm email (if required)
4. **Reminder**: Receive reminder email before appointment

## State Management

Using Context API for:
- **AuthContext**: User authentication state, login/logout functions
- **BusinessContext**: Current business data, settings
- **ThemeContext**: Theme preferences (dark/light mode)

## Routing Structure (Planned)

```
/                           # Home page
/login                      # Login page
/register                   # Registration page
/verify-email               # Email verification
/reset-password             # Password reset

/dashboard                  # Dashboard home (protected)
/dashboard/appointments     # Appointments list (protected)
/dashboard/appointments/:id # Appointment details (protected)
/dashboard/calendar         # Calendar view (protected)
/dashboard/manual-booking   # Manual booking form (protected)
/dashboard/analytics        # Analytics dashboard (protected)

/business/profile           # Business profile (protected)
/business/availability      # Availability settings (protected)
/business/special-dates     # Special dates management (protected)
/business/settings          # General settings (protected)

/book/:slug                 # Public booking page
/book/:slug/success         # Booking success
/confirm/:token             # Email confirmation
```

## Environment Variables

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Appointments
VITE_PUBLIC_BOOKING_URL=http://localhost:5173/book
```

## Features to Implement

### Phase 2: Authentication UI (Current)
- [ ] Login page with form validation
- [ ] Registration page with email verification
- [ ] Password reset flow
- [ ] Auth context and protected routes
- [ ] JWT token management

### Phase 3: Business Management UI
- [ ] Business profile creation/editing
- [ ] Availability configuration interface
- [ ] Break periods management
- [ ] Special dates calendar
- [ ] QR code display and download

### Phase 4: Public Booking UI
- [ ] Public business page layout
- [ ] Interactive calendar component
- [ ] Time slot selector with availability
- [ ] Booking form with validation
- [ ] Email confirmation flow
- [ ] Success and error states

### Phase 5: Dashboard
- [ ] Dashboard layout and navigation
- [ ] Appointments list with filters
- [ ] Appointment detail modal
- [ ] Calendar view (daily/weekly/monthly)
- [ ] Manual booking form
- [ ] Quick actions and notifications

### Phase 6: Analytics UI
- [ ] Analytics dashboard layout
- [ ] Charts and graphs (Chart.js or Recharts)
- [ ] Statistics cards
- [ ] Date range selector
- [ ] Export functionality

### Phase 7: Polish
- [ ] Responsive design (mobile-first)
- [ ] Loading states and skeletons
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Accessibility improvements
- [ ] Dark mode support

## Development Notes

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types (if migrating to TS)
- Follow consistent file naming conventions
- Write accessible HTML (ARIA labels, semantic elements)
- Optimize images and assets
- Implement lazy loading for routes

## UI/UX Considerations

- Clean, modern interface
- Intuitive navigation
- Clear call-to-action buttons
- Helpful error messages
- Loading indicators for async operations
- Mobile-responsive design
- Fast page load times
- Smooth transitions and animations
- Accessible color contrast
- Clear form validation feedback

## Libraries to Consider

### UI Components
- **Material-UI** - Comprehensive component library
- **Tailwind CSS** - Utility-first CSS framework
- **Ant Design** - Enterprise-grade UI components

### Forms
- **React Hook Form** - Performant form validation
- **Formik** - Form state management
- **Yup** - Schema validation

### Date/Time
- **date-fns** - Modern date utility library
- **React Calendar** - Calendar component
- **React DatePicker** - Date picker component

### Charts
- **Chart.js** - Simple yet flexible charts
- **Recharts** - React chart library
- **Victory** - Composable charting library

### HTTP Client
- **Axios** - Promise-based HTTP client

### QR Code
- **qrcode.react** - QR code component

## Vite + React

This project uses Vite for fast development and optimized builds:
- Hot Module Replacement (HMR) for instant feedback
- Fast refresh for React components
- Optimized production builds with tree-shaking
- Built-in support for ES modules
- Fast cold start times

For more information, see the [Vite documentation](https://vite.dev/).
