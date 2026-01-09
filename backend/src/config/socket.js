import { Server } from 'socket.io';

let io = null;

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

  io.on('connection', (socket) => {
    console.log(`🔌 [SOCKET] Client connected: ${socket.id}`);

    // Join a room specific to a business (for targeted notifications)
    socket.on('join-business', (businessId) => {
      if (businessId) {
        socket.join(`business:${businessId}`);
        console.log(`🔌 [SOCKET] Client ${socket.id} joined room: business:${businessId}`);
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
