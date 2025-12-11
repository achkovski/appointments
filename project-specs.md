# Appointments Project Specification

## Project Overview
A modern web application designed to enable users to book appointments online. The system is intended for both individuals offering services (fitness trainers, consultants, freelancers) and businesses (medical practices, dental offices, marketing agencies, restaurants, etc.). The goal is to provide a fully digital, convenient method for managing appointments, eliminating the need for constant phone communication or manual record-keeping.

## Tech Stack

### Frontend
- **Framework**: React 19
- **Language**: JavaScript (TypeScript consideration for future)
- **Build Tool**: Vite
- **State Management**: Context API
- **Styling**: TBD (Tailwind CSS / Material-UI / CSS Modules)
- **Routing**: React Router

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Database - serverless)
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer with Gmail/SMTP

## Core Features

### 1. User Authentication & Authorization
- Business user registration and login
- Client registration optional (can book as guest with email confirmation)
- Role-based access control (Admin, Business User, Client)
- Password reset functionality via email
- Secure session management with JWT tokens
- Email verification for new accounts

### 2. Personalized Business Calendar System
Each business user can create a fully customizable calendar with:

#### Working Hours & Days Configuration
- Set standard working days (e.g., Monday-Friday)
- Define working hours for each day
- Set break periods (lunch breaks, rest periods)
- Mark specific days as non-working (holidays, weekends, personal leave)
- **Special Exceptions**: Override standard hours for specific dates (e.g., shorter hours, full closures)

#### Capacity Management
- **Single Appointment Mode**: For individual service providers (1 client per time slot)
- **Multiple Appointment Mode**: For businesses serving concurrent clients (restaurants, hospitals)
  - Set capacity limits per time slot or entire day
  - Automatic blocking when capacity is reached
- Prevent double bookings automatically

#### Availability Status
- Mark specific hours/days as unavailable
- Mark time slots as fully booked
- Real-time availability updates

#### Time Slot Configuration
- **Default Interval**: 15 minutes (configurable)
- **Preset Options**: 5, 10, 15, 30, 45, 60 minutes, etc.
- Business can set custom time slot intervals
- Intervals can be set globally or per service

### 3. Service Management
Businesses can offer multiple services with individual configurations:

#### Service Features
- **Multiple Services**: Add unlimited services (e.g., haircut, massage, consultation, table reservation)
- **Service Details**: Name, description, duration, price (optional)
- **Duration Settings**: Each service has its own duration/interval
- **Preset Intervals**: 5, 10, 15, 30, 45, 60, 90, 120 minutes
- **Active/Inactive**: Enable or disable services without deleting
- **Service Selection**: Clients choose service before booking
- **Auto-Selection**: If only one service exists, automatically select it
- **Service-Specific Availability**: Optional - different working hours per service (future)

#### Booking Flow with Services
1. Client visits booking page
2. If multiple services: Select service from list
3. If one service: Auto-selected, proceed to calendar
4. View available time slots based on service duration
5. Complete booking

### 4. Unique Business Booking Page
Each registered business receives:
- **Unique URL**: Dedicated booking page link (e.g., `/book/business-name` or `/book/:businessId`)
- **QR Code Generation**: Downloadable QR code for easy sharing
- **Public Calendar View**: Client-facing calendar and time slot selector
- **Shareable Links**: Easy distribution via social media, email, website

The booking page displays:
- List of available services (if multiple)
- Available dates and time slots (based on selected service duration)
- Business information and description
- Service details (name, description, duration, price)
- Booking form for client information

### 5. Client Booking Workflow
Clients can book appointments through the public page:
- **No Login Required**: Quick booking as guest
- **Required Information**: First name, last name, phone number, email address
- **Email Confirmation** (optional, configurable): Spam protection mechanism
  - Client receives confirmation email with validation link
  - Appointment becomes valid only after email confirmation
- **Automatic Calendar Update**: Real-time database updates to prevent conflicts
- **24/7 Availability**: Book appointments anytime, including outside business hours
- **Booking Confirmation**: Immediate confirmation with appointment details

### 6. Business Dashboard
Comprehensive management interface for business users:

#### Appointment Management
- View all upcoming, past, and cancelled appointments
- **Manual Confirmation**: Approve pending appointments (if auto-confirmation disabled)
- **Add Notes**: Internal notes for each appointment
- **Modify Appointments**: Change date, time, or details
- **Cancel Appointments**: With optional notification to client
- **Manual Insertion**: Add offline/phone bookings manually
- **Contact Client**: Direct communication options (email/phone display)

#### Calendar View
- Daily, weekly, monthly views
- Color-coded appointment statuses
- Drag-and-drop rescheduling (future enhancement)

#### Settings & Configuration
- **Service Management**: Add, edit, disable services with custom durations
- Toggle automatic confirmation on/off
- Enable/disable email confirmation requirement
- Set reminder email preferences (timing, content)
- Configure working hours, breaks, and capacity
- Set default time slot interval (5, 10, 15, 30 mins, etc.)
- Manage non-working days and exceptions
- Business profile editing (name, description, contact info)

### 7. Analytics Dashboard
Help businesses understand booking patterns and make data-driven decisions:
- **Popular Days**: Days with most bookings
- **Popular Time Slots**: Most frequently booked hours
- **Cancellation Rate**: Percentage and count of cancelled appointments
- **No-Show Rate**: Track clients who didn't show up
- **Booking Trends**: Weekly/monthly booking volume
- **Peak Hours**: Busiest times of day
- **Revenue Tracking** (if payment integration added)

Visual representations:
- Charts and graphs for booking trends
- Heatmap for popular time slots
- Statistical summaries

### 8. Notification System
Automated email notifications:

#### For Clients
- **Booking Confirmation**: Immediately after reservation
- **Email Validation**: Link to confirm booking (if enabled)
- **Reminder Emails**: Configurable timing (24 hours before, 3 hours before, etc.)
- **Cancellation Notice**: If business cancels or reschedules
- **Rescheduling Confirmation**: When appointment is modified

#### For Business Users
- **New Booking Alert**: Real-time notification of new appointments
- **Cancellation Alert**: When client cancels
- **Daily Summary**: Morning email with day's schedule

Future enhancements:
- SMS notifications
- Push notifications (for mobile app)

### 9. Spam Protection & Security
- Email confirmation requirement (configurable per business)
- Rate limiting on booking API
- CAPTCHA for public booking form (future)
- Admin moderation for suspicious bookings

## Database Schema

### Users Table
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
first_name (VARCHAR)
last_name (VARCHAR)
role (ENUM: 'admin', 'business', 'client')
phone (VARCHAR)
email_verified (BOOLEAN, default: false)
email_verification_token (VARCHAR, nullable)
reset_password_token (VARCHAR, nullable)
reset_password_expires (TIMESTAMP, nullable)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Businesses Table
```sql
id (UUID, PK)
owner_id (UUID, FK -> Users.id)
business_name (VARCHAR)
slug (VARCHAR, UNIQUE) - for URL
description (TEXT)
address (TEXT)
phone (VARCHAR)
email (VARCHAR)
website (VARCHAR, nullable)
business_type (VARCHAR) - e.g., 'restaurant', 'medical', 'fitness'
qr_code_url (VARCHAR, nullable)
capacity_mode (ENUM: 'single', 'multiple')
default_capacity (INTEGER) - for multiple mode
default_slot_interval (INTEGER, default: 15) - default time slot in minutes
auto_confirm (BOOLEAN, default: true)
require_email_confirmation (BOOLEAN, default: false)
settings (JSON) - additional customizable settings
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Services Table
```sql
id (UUID, PK)
business_id (UUID, FK -> Businesses.id)
name (VARCHAR) - e.g., 'Haircut', 'Massage', 'Consultation'
description (TEXT, nullable)
duration (INTEGER) - duration in minutes (5, 10, 15, 30, 45, 60, 90, 120, etc.)
price (DECIMAL, nullable) - optional pricing
is_active (BOOLEAN, default: true) - enable/disable service
display_order (INTEGER, default: 0) - for sorting services
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Appointments Table
```sql
id (UUID, PK)
business_id (UUID, FK -> Businesses.id)
service_id (UUID, FK -> Services.id) - selected service
client_user_id (UUID, FK -> Users.id, nullable) - if client has account
client_first_name (VARCHAR)
client_last_name (VARCHAR)
client_email (VARCHAR)
client_phone (VARCHAR)
appointment_date (DATE)
start_time (TIME)
end_time (TIME)
status (ENUM: 'pending', 'confirmed', 'completed', 'cancelled', 'no_show')
is_email_confirmed (BOOLEAN, default: false)
email_confirmation_token (VARCHAR, nullable)
notes (TEXT, nullable) - business notes
client_notes (TEXT, nullable) - client-provided notes
cancellation_reason (TEXT, nullable)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Availability Table (Standard Working Hours)
```sql
id (UUID, PK)
business_id (UUID, FK -> Businesses.id)
day_of_week (INTEGER: 0-6, where 0=Sunday)
start_time (TIME)
end_time (TIME)
is_available (BOOLEAN)
capacity_override (INTEGER, nullable) - override default capacity for this day
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Breaks Table
```sql
id (UUID, PK)
availability_id (UUID, FK -> Availability.id)
break_start (TIME)
break_end (TIME)
created_at (TIMESTAMP)
```

### SpecialDates Table (Exceptions)
```sql
id (UUID, PK)
business_id (UUID, FK -> Businesses.id)
date (DATE)
is_available (BOOLEAN)
start_time (TIME, nullable)
end_time (TIME, nullable)
capacity_override (INTEGER, nullable)
reason (VARCHAR) - e.g., 'Holiday', 'Maintenance', 'Special Event'
created_at (TIMESTAMP)
```

### Notifications Table
```sql
id (UUID, PK)
appointment_id (UUID, FK -> Appointments.id, nullable)
recipient_email (VARCHAR)
notification_type (ENUM: 'booking_confirmation', 'reminder', 'cancellation', 'reschedule', 'business_alert')
status (ENUM: 'pending', 'sent', 'failed')
scheduled_for (TIMESTAMP, nullable) - for reminder emails
sent_at (TIMESTAMP, nullable)
error_message (TEXT, nullable)
created_at (TIMESTAMP)
```

### Analytics Table (Optional - for caching)
```sql
id (UUID, PK)
business_id (UUID, FK -> Businesses.id)
date (DATE)
total_appointments (INTEGER)
confirmed_appointments (INTEGER)
cancelled_appointments (INTEGER)
no_shows (INTEGER)
created_at (TIMESTAMP)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register business user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Business Management
- `GET /api/businesses` - List all businesses (admin)
- `GET /api/businesses/:id` - Get business details
- `GET /api/businesses/slug/:slug` - Get business by slug/URL
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/:id` - Update business profile
- `DELETE /api/businesses/:id` - Delete business
- `POST /api/businesses/:id/generate-qr` - Generate QR code
- `GET /api/businesses/:id/settings` - Get business settings
- `PUT /api/businesses/:id/settings` - Update business settings

### Service Management
- `GET /api/businesses/:businessId/services` - List all services for business
- `GET /api/businesses/:businessId/services/active` - List active services only
- `GET /api/services/:id` - Get service details
- `POST /api/businesses/:businessId/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `PUT /api/services/:id/toggle` - Toggle service active/inactive
- `PUT /api/services/reorder` - Update display order of services

### Availability Management
- `GET /api/businesses/:id/availability` - Get standard working hours
- `PUT /api/businesses/:id/availability` - Update working hours
- `POST /api/businesses/:id/availability/breaks` - Add break period
- `DELETE /api/businesses/:id/availability/breaks/:breakId` - Remove break
- `GET /api/businesses/:id/special-dates` - Get exception dates
- `POST /api/businesses/:id/special-dates` - Add exception date
- `PUT /api/businesses/:id/special-dates/:dateId` - Update exception
- `DELETE /api/businesses/:id/special-dates/:dateId` - Remove exception

### Public Booking (No Auth Required)
- `GET /api/public/businesses/:slug` - Get public business info with active services
- `GET /api/public/businesses/:slug/services` - Get all active services for booking
- `GET /api/public/businesses/:slug/available-slots?serviceId=&date=` - Get available time slots for service and date range
- `POST /api/public/appointments` - Create appointment (guest booking with service selection)
- `POST /api/public/appointments/confirm-email` - Confirm appointment via email token
- `GET /api/public/appointments/:id/verify` - Verify appointment exists

### Appointments Management (Authenticated)
- `GET /api/appointments` - List all appointments (filtered by business)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment manually (business)
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `PUT /api/appointments/:id/confirm` - Confirm pending appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `GET /api/appointments/business/:businessId` - Business appointments
- `GET /api/appointments/upcoming` - Upcoming appointments
- `GET /api/appointments/past` - Past appointments

### Analytics
- `GET /api/analytics/business/:businessId/overview` - General statistics
- `GET /api/analytics/business/:businessId/popular-days` - Popular booking days
- `GET /api/analytics/business/:businessId/popular-times` - Popular time slots
- `GET /api/analytics/business/:businessId/cancellation-rate` - Cancellation statistics
- `GET /api/analytics/business/:businessId/trends` - Booking trends over time

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/test-email` - Test email configuration

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID (admin)

## Development Phases

### Phase 1: Foundation ✅ (COMPLETED)
- Project structure setup
- Frontend (React + Vite) initialization
- Backend (Node.js + Express) initialization
- Git workflow established

### Phase 2: Database & Authentication ✅ (COMPLETED)
- Select and configure ORM (Prisma recommended)
- Set up Neon PostgreSQL connection
- Implement database schema
- User authentication (register, login, JWT)
- Email verification system
- Password reset functionality

### Phase 3: Business Management ✅ (COMPLETED)
- Business profile CRUD
- Availability configuration (working hours, breaks)
- Special dates/exceptions management
- Unique slug/URL generation
- QR code generation
- Business settings page

### Phase 4: Public Booking System ✅ (COMPLETED)
- Public business page
- Available slots calculation logic
- Guest booking form
- Email confirmation workflow (optional)
- Real-time availability checking
- Capacity management logic

### Phase 5: Business Dashboard ✅ (COMPLETED)
- Dashboard layout and navigation
- Appointments list view (upcoming, past, cancelled)
- Appointment detail view
- Manual appointment creation
- Appointment modification (reschedule, cancel)
- Manual confirmation workflow
- Notes and client contact

### Phase 6: Notifications (CURRENT)
- Email service setup (Nodemailer)
- Booking confirmation emails
- Email confirmation system
- Reminder email scheduler
- Cancellation/reschedule notifications
- Business alert emails

### Phase 7: Analytics
- Data aggregation queries
- Analytics dashboard UI
- Popular days/times visualization
- Cancellation rate tracking
- Booking trends charts
- Export functionality (CSV, PDF)

### Phase 8: Testing & Polish
- Unit tests (backend logic)
- Integration tests (API endpoints)
- E2E tests (user workflows)
- UI/UX improvements
- Performance optimization
- Mobile responsiveness
- Accessibility compliance

### Phase 9: Deployment
- Production environment setup
- CI/CD pipeline
- Database migrations
- Monitoring and logging
- Documentation

## Future Enhancements
- SMS notifications (Twilio integration)
- Payment processing (Stripe/PayPal)
- Service-specific availability (different working hours per service)
- Recurring appointments (weekly, monthly bookings)
- Waitlist management
- Mobile app (React Native)
- Multi-language support (i18n)
- Customer reviews and ratings
- Integration with external calendars (Google Calendar, Outlook)
- Advanced analytics and reporting
- Appointment reminders via WhatsApp
- Video call integration (Zoom, Google Meet)
- Team/staff management (multiple service providers)
- Timezone support for international bookings

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://[neon-connection-string]

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# Email Service
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@appointments.com

# Frontend URL
CLIENT_URL=http://localhost:5173

# Base URL for QR codes and links
BASE_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Appointments
VITE_PUBLIC_BOOKING_URL=http://localhost:5173/book
```

## Notes
- All development on feature branches
- Never push directly to main
- Keep all past branches (do not delete after merge)
- Regular commits with meaningful messages
- Code reviews before merging to development
- Follow ESLint/Prettier standards
- Refer to CLAUDE.md for master project description

## Key Project Clarifications
- **ORM**: Prisma confirmed for PostgreSQL/Neon integration
- **Time Slot Intervals**: Default 15 minutes, with preset options (5, 10, 15, 30, 45, 60, 90, 120 mins)
- **Multi-Service Support**: Core feature (not future enhancement) - businesses can offer multiple services
- **Service Duration**: Each service has its own configurable duration
- **Service Selection**: Auto-select if one service, otherwise client chooses before booking
- **Timezone**: For local use only - no timezone conversion needed initially
- **Capacity Management**: Single or multiple concurrent appointments per time slot
