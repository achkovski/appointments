# Appointments Backend

Node.js/Express API server for the Appointments Management System.

## Tech Stack

- Node.js (ES Modules)
- Express.js
- PostgreSQL (Neon)
- JWT Authentication

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
   - Configure email settings (if using notifications)

4. Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon (auto-reload)
- `npm test` - Run tests (to be implemented)

## API Endpoints

### Health Check
- `GET /` - API status
- `GET /api/health` - Health check endpoint

### Authentication (Coming Soon)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Appointments (Coming Soon)
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.js        # Entry point
├── .env.example        # Environment variables template
├── package.json
└── README.md
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database

This project uses PostgreSQL via Neon. Make sure to:
1. Create a Neon account and database
2. Copy the connection string to your `.env` file
3. Run migrations (to be implemented with Prisma/Sequelize)
