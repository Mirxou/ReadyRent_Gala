import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = 3004;

// userId -> Set<socket.id>
const userSockets = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  let currentUserId: string | null = null;

  socket.on('join', (data: { userId: string }) => {
    currentUserId = data.userId;

    if (!userSockets.has(currentUserId)) {
      userSockets.set(currentUserId, new Set());
    }
    userSockets.get(currentUserId)!.add(socket.id);

    socket.emit('joined', { userId: currentUserId, status: 'connected' });
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    if (currentUserId) {
      const sockets = userSockets.get(currentUserId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(currentUserId);
        }
      }
    }
  });
});

// Expose a function to send notification to a specific user
// This can be called from the main Next.js app via HTTP
const originalListen = httpServer.listen.bind(httpServer);
httpServer.listen = function (port: number, ...args: any[]) {
  return originalListen(port, ...args);
} as any;

// Export for programmatic use
export { io, userSockets, PORT };

httpServer.listen(PORT, () => {
  console.log(`Notifications WebSocket service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Notifications service shutting down...');
  httpServer.close(() => {
    console.log('Notifications service closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Notifications service shutting down...');
  httpServer.close(() => {
    console.log('Notifications service closed');
    process.exit(0);
  });
});
