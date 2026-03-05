import { Server } from 'socket.io';
import cookie from 'cookie';
import { verifyJWT } from '../utils/tokenGenerator.js';
import { eq, and } from 'drizzle-orm';
import db from './database.js';
import { businesses } from './schema.js';

let io = null;

/**
 * Authenticate Socket.IO connection by verifying JWT from httpOnly cookie
 */
async function authenticateSocket(socket, next) {
  try {
    const rawCookies = socket.handshake.headers.cookie;
    if (!rawCookies) {
      return next(new Error('Authentication required'));
    }

    const cookies = cookie.parse(rawCookies);
    const token = cookies.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyJWT(token);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
}

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authenticate every connection via JWT cookie
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 [SOCKET] Client connected: ${socket.id} (user: ${socket.userId})`);

    // Join a room specific to a business (for targeted notifications)
    socket.on('join-business', async (businessId) => {
      if (!businessId) return;

      try {
        // Verify this user owns the business
        const [biz] = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, socket.userId)))
          .limit(1);

        if (!biz) {
          socket.emit('error', { message: 'Not authorized for this business' });
          return;
        }

        socket.join(`business:${businessId}`);
        console.log(`🔌 [SOCKET] Client ${socket.id} joined room: business:${businessId}`);
      } catch (error) {
        console.error(`🔌 [SOCKET] join-business error:`, error.message);
        socket.emit('error', { message: 'Failed to join business room' });
      }
    });

    // Leave business room
    socket.on('leave-business', (businessId) => {
      if (businessId) {
        socket.leave(`business:${businessId}`);
        console.log(`🔌 [SOCKET] Client ${socket.id} left room: business:${businessId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [SOCKET] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  console.log('🔌 [SOCKET] Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance
 * @returns {Server|null} Socket.IO server instance
 */
export function getIO() {
  if (!io) {
    console.warn('🔌 [SOCKET] Socket.IO not initialized yet');
  }
  return io;
}

/**
 * Emit event to a specific business room
 * @param {string} businessId - The business ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function emitToBusinessRoom(businessId, event, data) {
  if (io) {
    io.to(`business:${businessId}`).emit(event, data);
    console.log(`🔌 [SOCKET] Emitted "${event}" to business:${businessId}`);
  }
}

/**
 * Emit event to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
    console.log(`🔌 [SOCKET] Emitted "${event}" to all clients`);
  }
}

export default {
  initializeSocket,
  getIO,
  emitToBusinessRoom,
  emitToAll
};
