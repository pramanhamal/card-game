// server.js (or index.js)

import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';

const app = express();

// 1) Enable CORS for your React front‑end origin
app.use(cors({
  origin: 'https://callbreak-hxwr.onrender.com',
  credentials: true
}));

// (optional) a quick sanity‑check route
app.get('/', (req, res) => {
  res.send('Socket.IO + CORS server is up');
});

// 2) Create the HTTP server and bind Socket.IO to it
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: 'https://callbreak-hxwr.onrender.com',
    methods: ['GET','POST'],
    credentials: true
  }
});

// 3) Your socket‐event handlers
io.on('connection', socket => {
  console.log('↔️  Client connected:', socket.id);

  // example handler
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    io.to(roomId).emit('userJoined', socket.id);
  });

  // clean up on disconnect
  socket.on('disconnect', () => {
    console.log('❌  Client disconnected:', socket.id);
  });
});

// 4) Start listening
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀  Listening on port ${PORT}`);
});
