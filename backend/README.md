# Appointments Backend

Node.js/Express API server for the Appointments Management System.

## Tech Stack

- Node.js (ES Modules)
- Express.js 5
- PostgreSQL (Neon - serverless)
- JWT Authentication
- Nodemailer (Email notifications)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - Add your Neon PostgreSQL connection string
   - Set a secure JWT secret
   - Configure email settings (Gmail or SMTP)
   - Set frontend URL for CORS

4. Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon (auto-reload)
- `npm test` - Run tests (to be implemented)

## Current API Endpoints

### Health Check
- `GET /` - API status and version
- `GET /api/health` - Health check with timestamp

## Planned API Endpoints

### Authentication
- `POST /api/auth/register` - Register business user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Business Management
- `GET /api/businesses` - List all businesses (admin only)
- `GET /api/businesses/:id` - Get business details
- `GET /api/businesses/slug/:slug` - Get business by URL slug
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/:id` - Update business profile
- `DELETE /api/businesses/:id` - Delete business
- `POST /api/businesses/:id/generate-qr` - Generate QR code for booking page
- `GET /api/businesses/:id/settings` - Get business settings
- `PUT /api/businesses/:id/settings` - Update business settings

### Availability Management
- `GET /api/businesses/:id/availability` - Get standard working hours
- `PUT /api/businesses/:id/availability` - Update working hours
- `POST /api/businesses/:id/availability/breaks` - Add break period
- `DELETE /api/businesses/:id/availability/breaks/:breakId` - Remove break period
- `GET /api/businesses/:id/special-dates` - Get exception dates (holidays, custom hours)
- `POST /api/businesses/:id/special-dates` - Add exception date
- `PUT /api/businesses/:id/special-dates/:dateId` - Update exception
- `DELETE /api/businesses/:id/special-dates/:dateId` - Remove exception

### Public Booking (No Authentication Required)
- `GET /api/public/businesses/:slug` - Get public business information
- `GET /api/public/businesses/:slug/available-slots` - Get available time slots for date range
- `POST /api/public/appointments` - Create appointment (guest booking)
- `POST /api/public/appointments/confirm-email` - Confirm appointment via email token
- `GET /api/public/appointments/:id/verify` - Verify appointment exists

### Appointments Management (Authenticated)
- `GET /api/appointments` - List all appointments (filtered by business)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment manually (for offline bookings)
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `PUT /api/appointments/:id/confirm` - Confirm pending appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `GET /api/appointments/business/:businessId` - Get business appointments
- `GET /api/appointments/upcoming` - Get upcoming appointments
- `GET /api/appointments/past` - Get past appointments

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
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID (admin only)

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   │   └── database.js # Database connection setup
│   ├── controllers/    # Route controllers
│   │   ├── authController.js
│   │   ├── businessController.js
│   │   ├── appointmentController.js
│   │   ├── analyticsController.js
│   │   └── publicController.js
│   ├── models/         # Database models (ORM)
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Appointment.js
│   │   ├── Availability.js
│   │   └── Notification.js
│   ├── routes/         # API routes
│   │   ├── authRoutes.js
│   │   ├── businessRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── publicRoutes.js
│   ├── middleware/     # Custom middleware
│   │   ├── auth.js     # JWT authentication
│   │   ├── validate.js # Request validation
│   │   └── errorHandler.js
│   ├── services/       # Business logic
│   │   ├── emailService.js # Email notifications
│   │   ├── qrService.js    # QR code generation
│   │   ├── availabilityService.js # Slot calculation
│   │   └── reminderService.js # Scheduled reminders
│   ├── utils/          # Utility functions
│   │   ├── slugGenerator.js
│   │   ├── tokenGenerator.js
│   │   └── dateHelpers.js
│   └── index.js        # Entry point
├── .env.example        # Environment variables template
├── package.json
└── README.md           # This file
```

## Environment Variables

See `.env.example` for all required environment variables:

### Required
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (use strong random string)
- `EMAIL_USER` - Email account for sending notifications
- `EMAIL_PASSWORD` - Email account password or app-specific password

### Optional
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `BASE_URL` - Base URL for QR codes and booking links

## Database

This project uses PostgreSQL via Neon (serverless).

### Setup Steps:
1. Create a Neon account at https://neon.tech
2. Create a new database project
3. Copy the connection string
4. Add to your `.env` file as `DATABASE_URL`
5. Run migrations (to be implemented with selected ORM)

### ORM Options:
- **Prisma** (recommended) - Type-safe, excellent DX
- **Sequelize** - Mature, feature-rich
- **TypeORM** - TypeScript-first

## Core Features to Implement

### Phase 2: Database & Authentication (Current)
- [ ] Select and configure Prisma as ORM
- [ ] Set up database connection
- [ ] Create all database models
- [ ] Implement user registration with email verification
- [ ] Implement JWT authentication
- [ ] Password reset functionality

### Phase 3: Business Management
- [ ] Business CRUD operations
- [ ] Unique slug generation
- [ ] QR code generation service
- [ ] Working hours configuration
- [ ] Break periods management
- [ ] Special dates/exceptions

### Phase 4: Public Booking
- [ ] Public business page API
- [ ] Available slots calculation logic
- [ ] Guest booking creation
- [ ] Email confirmation workflow
- [ ] Capacity checking and enforcement

### Phase 5: Notifications
- [ ] Email service setup with Nodemailer
- [ ] Booking confirmation emails
- [ ] Email verification system
- [ ] Reminder email scheduler (cron job)
- [ ] Cancellation/reschedule notifications

### Phase 6: Analytics
- [ ] Data aggregation queries
- [ ] Popular days/times calculation
- [ ] Trend analysis
- [ ] Statistics endpoints

## Development Notes

- Use ES Modules (type: "module" in package.json)
- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling with custom error classes
- Validate all inputs before processing
- Use middleware for authentication and authorization
- Log important operations for debugging
- Rate limit public endpoints to prevent abuse

## Testing

Testing infrastructure to be implemented:
- Unit tests with Jest
- Integration tests for API endpoints
- Mock database for testing
- Test coverage reporting

## Security Considerations

- Hash passwords with bcrypt
- Use strong JWT secrets
- Implement rate limiting
- Sanitize user inputs
- Use parameterized queries to prevent SQL injection
- Implement CORS properly
- Validate email tokens with expiration
- Use HTTPS in production
