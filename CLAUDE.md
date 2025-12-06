# CLAUDE.md

## MASTER PROJECT DESCRIPTION
The project is a web application designed to enable users to book appointments online. It is intended for both individuals who offer services that require scheduled appointments and businesses such as medical practices, dental offices, fitness trainers, marketing agencies, restaurants, and similar organizations, both falling under the same business user. The goal of the application is to provide a modern, convenient, and fully digital method for managing appointments without the need for constant phone communication or manual record-keeping.

The application will allow each business user to create a personalized calendar where available dates and time slots can be defined. Calendar owners will be able to set their working days, working hours, and break periods, as well as mark days or hours as unavailable or fully booked. These settings can be standardized so that certain days and hours are always non-working, while also allowing special exceptions for specific dates, such as shorter working hours or full-day closures. For individuals who offer one-on-one services, only a single appointment can be reserved per time slot. For businesses that can serve multiple clients at the same time, such as restaurants or hospitals, a capacity limit can be set and automatically managed by the system. Once capacity for a given date or time is reached, clients will no longer be able to book a reservation for that slot.

Each registered business or individual service provider will receive a unique business page with a dedicated link. This page will display the calendar and time selector where clients can choose a preferred date and time from the available options. Clients will be required to enter their personal information, such as first name, last name, phone number, and email address, in order to complete the reservation. After a reservation is made, the system will automatically update the calendar database to prevent double bookings. The application will also support generating a shareable link or QR code, making it easy for clients to access the booking page.

Business users will have access to a dashboard that provides full control and visibility over all scheduled appointments. Through this dashboard, they can view all upcoming reservations, confirm them (if automatic confirmation is disabled), add notes, cancel reservations, modify the date or time, or contact the client. They will also have the option to manually insert reservations into the system for clients who book offline or over the phone. The dashboard is intended to give business users clear oversight and management of their daily schedule.

An analytics section will be included to help businesses understand their booking patterns. This will show which days have the highest number of reservations, which hours are most frequently booked, how many appointments were cancelled, and similar statistics that can help businesses make informed decisions about their operations.

For clients, the application provides a simple, fast, and contactless way to book appointments online from any location and at any time, including outside business hours. To protect businesses from spam bookings, each reservation can require email confirmation by the client before it is considered valid. This can be set by the business user in the settings. The system can also automatically send reminder emails to clients a day before or a few hours before the scheduled appointment.

Business users will have access to a variety of customizable settings that allow them to tailor the system to their specific needs. They can configure non-working days such as holidays, weekends, or personal leave, set available working hours, define capacity limits for certain time periods or the entire day, and adjust other relevant scheduling options. Through these customization features, each business or service provider can adapt the application to their unique workflow.

Overall, this project aims to modernize the scheduling process by providing clarity, automation, centralized data storage, and easy client access. It eliminates the need for manual tracking and constant phone communication while offering a flexible and professional booking experience for both service providers and clients.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a General Business appointment management system built as a monorepo with separate backend and frontend applications. The system allows businesses to manage bookings, track appointments, and provide clients with scheduling interfaces.

## Architecture

### Monorepo Structure
- **backend/** - Node.js/Express API (ES Modules)
- **frontend/** - React/Vite SPA (ES Modules)
- Both applications are independent with their own package.json and can be run separately

### Backend Architecture (backend/)
- **Entry point**: `src/index.js` - Express server with CORS, JSON middleware, health checks
- **Layered structure** (currently empty, to be populated):
  - `src/config/` - Database connections, environment configs
  - `src/controllers/` - HTTP request handlers
  - `src/models/` - Database models (ORM TBD: Prisma/Sequelize/TypeORM)
  - `src/routes/` - Express route definitions
  - `src/middleware/` - Auth, validation, error handling
  - `src/services/` - Business logic (email notifications, calendar integration)
  - `src/utils/` - Helper functions

### Frontend Architecture (frontend/)
- **Entry point**: `src/main.jsx` - React 19 app initialization
- **Component organization** (directories created, to be populated):
  - `src/pages/` - Full page components (Dashboard, Login, etc.)
  - `src/components/` - Reusable UI components
  - `src/services/` - API client functions (Axios to be added)
  - `src/context/` - React Context providers for global state
  - `src/hooks/` - Custom React hooks
  - `src/utils/` - Helper functions

### Database
- PostgreSQL via **Neon Database** (serverless)
- ORM not yet selected (options: Prisma, Sequelize, TypeORM)
- Schema design in `project-specs.md`: Users, Businesses, Appointments, Availability, Notifications

### Authentication
- JWT-based authentication (not yet implemented)
- Role-based access: Admin, Business Owner, Client

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server with nodemon (auto-reload) on port 5000
npm start            # Start production server
npm test             # Run tests (not yet implemented)
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Running Both Services
Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`. Start both in separate terminals for full-stack development.

## Environment Configuration

### Backend (.env)
Copy `backend/.env.example` to `backend/.env` and configure:
- `DATABASE_URL` - Neon PostgreSQL connection string (required)
- `JWT_SECRET` - Secret key for JWT signing (required)
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- Email settings for notifications (EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD)

### Frontend (.env)
Copy `frontend/.env.example` to `frontend/.env` and configure:
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Git Workflow

**CRITICAL**: Never push directly to `main` branch.

### Branch Strategy
- `main` - Production (protected, no direct commits)
- `development` - Integration branch for all features
- `feature/*` - New features (branch from `development`)
- `bugfix/*` - Bug fixes (branch from `development`)
- `hotfix/*` - Critical production fixes (branch from `main`)

### Workflow
1. Create feature branch from `development`: `git checkout -b feature/feature-name`
2. Commit regularly with meaningful messages
3. Push to remote: `git push origin feature/feature-name`
4. Merge to `development` (never to `main`)
5. Keep all past branches (do not delete merged branches)

## API Design

### Current Endpoints
- `GET /` - API status and version
- `GET /api/health` - Health check with timestamp

### Planned Endpoints (from project-specs.md)
**Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`

**Appointments**: `/api/appointments` (CRUD), `/api/appointments/business/:businessId`, `/api/appointments/client/:clientId`

**Businesses**: `/api/businesses` (CRUD), `/api/businesses/:id/availability`

**Users**: `/api/users/profile`, `/api/users/:id`

**Notifications**: `/api/notifications`, `/api/notifications/:id/read`, `/api/notifications/send`

## Core Features to Implement

### 1. User Authentication
- User registration/login with JWT
- Role-based access control (Admin, Business Owner, Client)
- Password reset functionality

### 2. Dual Calendar System
- In-built calendar in business dashboard
- External calendar integration (Google Calendar, Outlook)
- Time zone support

### 3. Notifications
- Email notifications for appointment confirmations, reminders (24h before), cancellations, rescheduling
- SMS notifications (future enhancement)

### 4. Appointment Management
- CRUD operations with status tracking (pending, confirmed, completed, cancelled)
- Business availability management
- Client booking workflow

## Database Schema Reference

See `project-specs.md` for complete schema. Key tables:
- **Users**: id, email, password_hash, first_name, last_name, role, phone
- **Businesses**: id, owner_id, business_name, description, address, settings
- **Appointments**: id, business_id, client_id, title, start_time, end_time, status, notes
- **Availability**: id, business_id, day_of_week, start_time, end_time, is_available
- **Notifications**: id, user_id, appointment_id, type, message, sent_at, status

## Development Phases

Current: **Phase 1 - Foundation** (project structure complete)

Next steps:
1. Select and configure ORM (Prisma recommended for PostgreSQL)
2. Set up database connection to Neon
3. Implement authentication system
4. Build core API endpoints
5. Create frontend routing and pages

## Key Technical Decisions Pending

- ORM selection: Prisma vs Sequelize vs TypeORM
- Frontend state management: Context API vs Redux
- Styling framework: Tailwind CSS vs Material-UI vs CSS Modules
- Frontend routing library: React Router (mentioned in frontend README)
- API client: Axios (mentioned in frontend README)
