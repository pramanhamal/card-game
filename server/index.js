const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Create the app and server
const app = express();
const server = http.createServer(app);

// Allow CORS from your frontend origin
const FRONTEND_ORIGIN = "https://callbreak-hxwr.onrender.com";

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST"]
}));

// Create a new Socket.IO server with CORS support
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Basic route to test if server is running
app.get("/", (req, res) => {
  res.send("🎉 Server is running and ready for Socket.IO");
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  // Example handler
  socket.on('message', (data) => {
    console.log(`📨 Message received: ${data}`);
    socket.broadcast.emit('message', data); // Echo to others
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
