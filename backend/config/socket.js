import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  return io;
};

// Real-time notification emitter helper
export const emitRealTimeNotification = (recipientId, notification) => {
  if (io) {
    io.to(`user_${recipientId}`).emit('new_notification', notification);
    console.log(`Emitted socket notification to user_${recipientId}`);
  } else {
    console.log('Socket.io not initialized, skipping WS dispatch');
  }
};
