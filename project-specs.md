# Appointments Project Specification

## Project Overview
A General Business appointment management system that allows businesses to manage bookings, track appointments, and provide clients with an easy-to-use scheduling interface.

## Tech Stack

### Frontend
- **Framework**: React
- **Language**: JavaScript/TypeScript (TBD)
- **Build Tool**: Vite (recommended) or Create React App
- **State Management**: Context API / Redux (TBD)
- **Styling**: TBD (Tailwind CSS / Material-UI / CSS Modules)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (recommended)
- **Database**: PostgreSQL (Neon Database)
- **ORM**: TBD (Prisma / Sequelize / TypeORM)
- **Authentication**: JWT (JSON Web Tokens)

## Core Features

### 1. User Authentication
- User registration and login
- Role-based access control (Admin, Business Owner, Client)
- Password reset functionality
- Secure session management with JWT

### 2. Calendar Integration
- **Dual Calendar System**:
  - In-built calendar in business dashboard for internal management
  - External calendar integration (Google Calendar, Outlook, etc.)
- View availability and time slots
- Real-time booking updates
- Time zone support

### 3. Notifications
- Email notifications for:
  - Appointment confirmations
  - Appointment reminders (24 hours before)
  - Appointment cancellations
  - Appointment rescheduling
- SMS notifications (optional, future enhancement)

### 4. Appointment Management
- Create, read, update, delete appointments
- Booking workflow for clients
- Business dashboard for managing appointments
- Appointment status tracking (pending, confirmed, completed, cancelled)
- Notes and comments for appointments

## Database Schema (Initial Concepts)

### Users Table
- id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at

### Businesses Table
- id, owner_id (FK), business_name, description, address, phone, email, settings, created_at, updated_at

### Appointments Table
- id, business_id (FK), client_id (FK), title, description, start_time, end_time, status, notes, created_at, updated_at

### Availability Table
- id, business_id (FK), day_of_week, start_time, end_time, is_available, created_at, updated_at

### Notifications Table
- id, user_id (FK), appointment_id (FK), type, message, sent_at, status, created_at

## Project Structure

```
appointments/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files (database, env)
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware (auth, validation)
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Entry point
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── README.md
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service calls
│   │   ├── context/       # Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── docs/                   # Project documentation
├── .gitignore
├── project-specs.md        # This file
└── README.md              # Project overview
```

## Git Workflow

### Branch Strategy
- **main**: Production-ready code (protected, no direct pushes)
- **develop**: Integration branch for features
- **feature/[feature-name]**: Individual feature branches
- **bugfix/[bug-name]**: Bug fix branches
- **hotfix/[fix-name]**: Critical production fixes

### Workflow
1. Create feature branch from `develop`
2. Make changes and commit regularly
3. Push to remote feature branch
4. Create Pull Request to `develop`
5. After review and testing, merge to `develop`
6. When ready for release, merge `develop` to `main`

## API Endpoints (Planned)

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Appointments
- GET /api/appointments (list)
- GET /api/appointments/:id (detail)
- POST /api/appointments (create)
- PUT /api/appointments/:id (update)
- DELETE /api/appointments/:id (delete)
- GET /api/appointments/business/:businessId (business appointments)
- GET /api/appointments/client/:clientId (client appointments)

### Businesses
- GET /api/businesses (list)
- GET /api/businesses/:id (detail)
- POST /api/businesses (create)
- PUT /api/businesses/:id (update)
- DELETE /api/businesses/:id (delete)
- GET /api/businesses/:id/availability (get availability)
- PUT /api/businesses/:id/availability (update availability)

### Users
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/:id

### Notifications
- GET /api/notifications (user notifications)
- PUT /api/notifications/:id/read (mark as read)
- POST /api/notifications/send (send notification)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://[neon-connection-string]
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your-email
EMAIL_PASSWORD=your-app-password
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Appointments
```

## Development Phases

### Phase 1: Foundation
- Set up project structure
- Initialize frontend (React) and backend (Node.js)
- Configure database connection (Neon PostgreSQL)
- Set up basic authentication
- Create initial database schema

### Phase 2: Core Features
- User registration and login
- Business profile creation
- Basic appointment CRUD operations
- In-built calendar view

### Phase 3: Advanced Features
- Calendar integration (Google Calendar)
- Email notifications
- Availability management
- Appointment status workflow

### Phase 4: Polish & Enhancement
- UI/UX improvements
- Testing (unit, integration)
- Performance optimization
- Documentation

## Future Enhancements
- SMS notifications
- Payment processing
- Mobile app (React Native)
- Multi-language support
- Analytics dashboard
- Recurring appointments
- Waitlist management

## Notes
- All development should be done on feature branches
- Never push directly to main
- Regular commits with meaningful messages
- Code reviews required before merging to develop
- Keep dependencies up to date
- Follow consistent code style (use ESLint/Prettier)
