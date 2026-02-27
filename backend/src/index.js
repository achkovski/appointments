import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import publicBookingRoutes from './routes/publicBookingRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { startReminderScheduler } from './services/reminderScheduler.js';
import { startAutoCompleteScheduler } from './services/autoCompleteScheduler.js';
import { initializeSocket } from './config/socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initializeSocket(httpServer);

// Trust first proxy (Render, etc.) so rate limiters see real client IPs
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Appointments API Server',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', availabilityRoutes);
app.use('/api/public', publicBookingRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO ready for connections`);

  // Start the appointment reminder scheduler
  startReminderScheduler();
  console.log(`📧 Reminder scheduler initialized`);

  // Start the auto-complete scheduler
  startAutoCompleteScheduler();
  console.log(`✅ Auto-complete scheduler initialized`);
});
