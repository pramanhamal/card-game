// projectRoot/server/index.js

const express = require('express');
const http = require('http');
const { Server: IOServer } = require('socket.io');
const cors = require('cors');

const app = express();

// Enable CORS for your front‑end origin
app.use(cors({
  origin: 'https://callbreak-hxwr.onrender.com',
  credentials: true
}));

// Sanity‑check endpoint
app.get('/', (req, res) => {
  res.send('Socket.IO + CORS server is up');
});

// Create HTTP server + bind Socket.IO
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: 'https://callbreak-hxwr.onrender.com',
    methods: ['GET','POST'],
    credentials: true
  }
});

// Socket event handlers
io.on('connection', socket => {
  console.log('↔️  Client connected:', socket.id);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    io.to(roomId).emit('userJoined', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌  Client disconnected:', socket.id);
  });
});

// Start listening
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀  Listening on port ${PORT}`);
});
