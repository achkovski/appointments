# Appointments Management System

A modern, fully digital web application designed to enable users to book appointments online. Built for both individual service providers (fitness trainers, consultants, freelancers) and businesses (medical practices, dental offices, marketing agencies, restaurants, and more).

## What is This?

This application eliminates the need for constant phone communication or manual record-keeping by providing a convenient, automated system for managing appointments. Business users can create personalized calendars with customizable availability, while clients can book appointments 24/7 through unique, shareable booking pages.

## Key Features

### For Business Users
- **Personalized Calendar** - Define working hours, breaks, and capacity
- **Unique Booking Page** - Each business gets a dedicated URL and QR code
- **Flexible Capacity** - Single or multiple concurrent appointments
- **Smart Availability** - Set exceptions for holidays, special hours
- **Business Dashboard** - Full control over appointments and schedule
- **Manual Booking** - Add offline or phone bookings to the system
- **Analytics** - Understand booking patterns and trends
- **Automated Notifications** - Email confirmations and reminders
- **Spam Protection** - Optional email confirmation for bookings

### For Clients
- **Easy Booking** - No login required, book as a guest
- **24/7 Access** - Book appointments anytime, anywhere
- **Instant Confirmation** - Receive immediate booking confirmation
- **Reminder Emails** - Automatic reminders before appointments
- **Contactless** - Fully digital booking process

## Project Structure

```
appointments/
├── backend/          # Node.js/Express API server
├── frontend/         # React/Vite application
├── project-specs.md  # Comprehensive project specification
├── CLAUDE.md         # Development guidance and master description
└── README.md         # This file
```

## Tech Stack

- **Frontend**: React 19, Vite
- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: PostgreSQL (Neon - serverless)
- **Authentication**: JWT
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Neon account)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your .env file
   ```

4. Set up your Neon PostgreSQL database and add the connection string to backend/.env

### Running the Application

**Backend** (runs on port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (runs on port 5173):
```bash
cd frontend
npm run dev
```

## Documentation

- **project-specs.md** - Complete feature list, API endpoints, database schema, development phases
- **CLAUDE.md** - Master project description and development guidance
- **backend/README.md** - Backend-specific documentation
- **frontend/README.md** - Frontend-specific documentation

## Git Workflow

**IMPORTANT**: Never push directly to the `main` branch.

- **main** - Production branch (protected)
- **development** - Integration branch for all features
- **feature/*** - New feature branches
- **bugfix/*** - Bug fix branches

### Workflow:
1. Create feature branch from `development`
2. Make changes and commit regularly
3. Push to remote feature branch
4. Merge to `development` (never directly to `main`)
5. Keep all past branches (do not delete after merge)

## Development Status

**Current Phase**: Phase 2 - Database & Authentication

### Completed
- ✅ Project structure setup
- ✅ Backend and frontend initialization
- ✅ Git workflow established
- ✅ Comprehensive project specification

### Next Steps
1. Select and configure ORM (Prisma recommended)
2. Set up Neon PostgreSQL connection
3. Implement authentication system
4. Build business management features
5. Create public booking system

## Core Functionality

### Business Setup
1. Business user registers and verifies email
2. Creates business profile with unique URL/slug
3. Configures working hours, breaks, and capacity
4. Sets special exceptions (holidays, custom hours)
5. Generates shareable booking link and QR code

### Client Booking
1. Client visits unique booking page
2. Selects available date and time slot
3. Enters personal information (name, email, phone)
4. Confirms booking (with optional email verification)
5. Receives confirmation and reminder emails

### Business Management
1. View all appointments in dashboard
2. Manually confirm, modify, or cancel bookings
3. Add offline bookings to the system
4. View analytics and booking patterns
5. Contact clients directly

## Future Enhancements

- SMS notifications
- Payment processing integration
- Multiple services per business
- Recurring appointments
- Mobile app
- External calendar integration (Google Calendar, Outlook)
- Team/staff management
- Multi-language support

## License

TBD
