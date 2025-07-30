// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Use the cors middleware for all incoming requests

// Health check route to verify the server is running
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy and running!');
});

const server = http.createServer(app);

// Initialize Socket.IO with CORS settings to allow your frontend to connect
const io = new Server(server, {
  cors: {
    origin: "*", // Allows all origins. For production, you can restrict this to your frontend's URL.
    methods: ["GET", "POST"]
  }
});

let rooms = {}; // This object will store all active game rooms

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_lobby', (playerName) => {
    socket.data.playerName = playerName;
    socket.emit('rooms_update', rooms);
  });

  socket.on('create_room', () => {
    const roomId = `room_${socket.id}`;
    rooms[roomId] = { id: roomId, players: [], gameState: null };
    socket.join(roomId);
    rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });
    socket.emit('joined_room', rooms[roomId]);
    io.emit('rooms_update', rooms);
    console.log(`Room created: ${roomId} by ${socket.data.playerName}`);
  });

  socket.on('join_room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

      if (rooms[roomId].players.length === 4) {
        io.to(roomId).emit('start_game', { room: rooms[roomId] });
      } else {
        io.to(roomId).emit('room_update', rooms[roomId]);
      }
      io.emit('rooms_update', rooms);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('room_update', room);
        }
        io.emit('rooms_update', rooms);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✔️ Multiplayer server is running on port ${PORT}`);
});