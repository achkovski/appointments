# Appointments Frontend

React frontend application for the Appointments Management System, built with Vite.

## Tech Stack

- React 18
- Vite
- React Router (to be added)
- Axios (to be added)
- Context API for state management

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

## Project Structure

```
frontend/
├── src/
│   ├── assets/        # Images, fonts, static files
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components (Dashboard, Login, etc.)
│   ├── services/      # API service calls
│   ├── context/       # React Context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main App component
│   ├── App.css        # App styles
│   ├── index.css      # Global styles
│   └── main.jsx       # Entry point
├── public/            # Static assets
├── .env.example       # Environment variables template
├── index.html         # HTML entry point
├── vite.config.js     # Vite configuration
└── package.json
```

## Features (Planned)

- User authentication (login/register)
- Business dashboard
- Appointment booking interface
- Calendar views (in-built and external integration)
- Notifications
- User profile management

## Environment Variables

See `.env.example` for all required environment variables.

## Vite + React

This project uses Vite for fast development and optimized builds. It includes:
- Hot Module Replacement (HMR)
- Fast refresh for instant feedback
- Optimized production builds
- ESLint for code quality

For more information about Vite, see the [official documentation](https://vite.dev/).
