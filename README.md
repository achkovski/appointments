# AppointMe

A modern, fully digital web application for online appointment booking. Built for individual service providers and businesses of all sizes.

## Overview

AppointMe eliminates the need for constant phone communication or manual record-keeping by providing a convenient, automated system for managing appointments. Business users can create personalized calendars with customizable availability, while clients can book appointments 24/7 through unique, shareable booking pages.

**Perfect for:**
- Medical practices & dental offices
- Fitness trainers & personal coaches
- Marketing agencies & consultants
- Restaurants & hospitality
- Freelancers & solo entrepreneurs
- Any service-based business

## Features

### For Business Users
- **Personalized Calendar** - Define working days, hours, breaks, and capacity limits
- **Unique Booking Page** - Each business gets a dedicated URL and QR code for easy sharing
- **Flexible Capacity** - Support for single appointments or multiple concurrent bookings
- **Smart Availability** - Set regular schedules with exceptions for holidays and special hours
- **Business Dashboard** - Full control over all appointments with filtering and search
- **Manual Booking** - Add offline or phone bookings directly to the system
- **Analytics Dashboard** - Understand booking patterns, peak hours, and trends
- **Automated Notifications** - Email confirmations, reminders, and cancellation notices
- **Spam Protection** - Optional email confirmation required before bookings are validated
- **Services Management** - Define multiple services with custom durations and descriptions

### For Clients
- **Easy Booking** - No account required, book as a guest
- **24/7 Access** - Book appointments anytime from any device
- **Instant Confirmation** - Receive immediate booking confirmation via email
- **Reminder Emails** - Automatic reminders before scheduled appointments
- **Contactless Experience** - Fully digital booking process

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js (ES Modules) |
| Database | PostgreSQL (Neon - serverless) |
| ORM | Drizzle ORM |
| Authentication | JWT (JSON Web Tokens) |
| Email | Nodemailer |
| Icons | Lucide React |

## Project Structure

```
appointments/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/            # Database and app configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, validation, rate limiting
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic (email, scheduling)
│   │   └── utils/             # Helper functions
│   ├── drizzle/               # Database migrations
│   └── prisma/                # Prisma schema (alternative ORM)
├── frontend/                   # React/Vite application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client functions
│   │   └── lib/               # Utility functions
├── project-specs.md           # Detailed project specification
├── CLAUDE.md                  # Development guidance
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/achkovski/appointments.git
   cd appointments
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   Configure `backend/.env`:
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   JWT_REFRESH_SECRET=your_secure_refresh_secret_key
   PORT=5000
   CLIENT_URL=http://localhost:5173

   # Email Configuration (for notifications)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

   Configure `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run database migrations**
   ```bash
   cd ../backend
   node run-migration.js
   ```

### Running the Application

**Start the backend** (runs on port 5000):
```bash
cd backend
npm run dev
```

**Start the frontend** (runs on port 5173):
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access the application.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Business
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/business` | Get current user's business |
| POST | `/api/business` | Create new business |
| PUT | `/api/business` | Update business profile |
| PUT | `/api/business/settings` | Update business settings |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| POST | `/api/services` | Create new service |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments (with filters) |
| GET | `/api/appointments/:id` | Get appointment details |
| POST | `/api/appointments` | Create appointment (manual) |
| PUT | `/api/appointments/:id` | Update appointment |
| PUT | `/api/appointments/:id/status` | Update appointment status |
| DELETE | `/api/appointments/:id` | Cancel appointment |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability/schedule` | Get weekly schedule |
| PUT | `/api/availability/schedule` | Update weekly schedule |
| GET | `/api/availability/special-dates` | Get special dates |
| POST | `/api/availability/special-dates` | Add special date |
| DELETE | `/api/availability/special-dates/:id` | Remove special date |

### Public Booking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/book/:slug` | Get business public info |
| GET | `/api/book/:slug/slots` | Get available time slots |
| POST | `/api/book/:slug` | Create booking (guest) |
| GET | `/api/book/confirm/:token` | Confirm booking via email |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Get analytics overview |
| GET | `/api/analytics/appointments` | Appointment statistics |
| GET | `/api/analytics/peak-hours` | Peak hours analysis |

## Usage Guide

### For Business Owners

1. **Register** - Create an account with your email
2. **Verify Email** - Confirm your email address
3. **Setup Business** - Enter business details and create your unique booking URL
4. **Configure Availability** - Set your working hours and days off
5. **Add Services** - Define the services you offer
6. **Share Your Link** - Send your booking page URL or QR code to clients
7. **Manage Appointments** - Use the dashboard to handle all bookings

### For Clients

1. **Visit Booking Page** - Use the business's unique booking link
2. **Select Service** - Choose from available services
3. **Pick Date & Time** - Select from available slots
4. **Enter Details** - Provide your contact information
5. **Confirm Booking** - Verify via email if required
6. **Receive Confirmation** - Get booking details via email

## Git Workflow

**Important**: Never push directly to the `main` branch.

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `development` | Integration branch for features |
| `feature/*` | New feature development |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |

### Workflow:
1. Create feature branch from `development`
2. Make changes and commit regularly
3. Push to remote feature branch
4. Merge to `development`
5. Periodically merge `development` to `main` for releases

## Documentation

- **[project-specs.md](./project-specs.md)** - Complete feature specifications, API details, database schema
- **[CLAUDE.md](./CLAUDE.md)** - Development guidance and project architecture
- **[backend/README.md](./backend/README.md)** - Backend-specific documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend-specific documentation

## Future Enhancements

- SMS notifications
- Payment processing integration
- Recurring appointments
- Mobile applications (iOS/Android)
- External calendar sync (Google Calendar, Outlook)
- Team/staff management with individual calendars
- Multi-language support
- Custom branding options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database hosting by [Neon](https://neon.tech/)

---

Made with care for service providers and their clients.
