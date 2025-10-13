/**
 * Custom Next.js Server with Socket.IO
 *
 * This server integrates Socket.IO with Next.js for real-time collaboration features.
 * Run with: node server.js
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Import and initialize WebSocket handlers
  // Note: This is a dynamic import since we're using CommonJS
  import('./dist/server/websocket-handler.js')
    .then((module) => {
      if (module.initializeWebSocketHandlers) {
        module.initializeWebSocketHandlers(io);
        console.log('[Server] WebSocket handlers initialized');
      }
    })
    .catch((err) => {
      console.error('[Server] Error loading WebSocket handlers:', err);
      console.log('[Server] WebSocket handlers not loaded - using basic setup');

      // Fallback to basic Socket.IO setup
      io.on('connection', (socket) => {
        console.log('[Server] Client connected:', socket.id);

        socket.on('disconnect', () => {
          console.log('[Server] Client disconnected:', socket.id);
        });
      });
    });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready at ws://${hostname}:${port}/api/socket`);
  });
});
