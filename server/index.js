// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Your React app's address
    methods: ["GET", "POST"]
  }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // When a player sets their name and joins the lobby
  socket.on('join_lobby', (playerName) => {
    socket.data.playerName = playerName;
    socket.emit('rooms_update', rooms); // Send current rooms to the new player
  });

  // Create a new room
  socket.on('create_room', () => {
    const roomId = `room-${Date.now()}`;
    rooms[roomId] = { players: [], gameState: null };
    socket.join(roomId);
    rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });
    socket.emit('joined_room', roomId, rooms[roomId]);
    io.emit('rooms_update', rooms); // Update everyone in the lobby
  });

  // Join an existing room
  socket.on('join_room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

      // Notify everyone in the room about the new player
      io.to(roomId).emit('room_update', rooms[roomId]);

      // If the room is now full, start the game
      if (rooms[roomId].players.length === 4) {
        // NOTE: In a real app, you'd initialize the game state here using your gameLogic
        // For now, we'll just send a "start_game" event.
        console.log(`Starting game in room ${roomId}`);
        io.to(roomId).emit('start_game', { message: 'All players are in! Starting game.' });
      }
      io.emit('rooms_update', rooms); // Update everyone in the lobby
    }
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Handle player leaving a room
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex > -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId]; // Delete empty room
        } else {
          io.to(roomId).emit('room_update', room); // Notify other players in the room
        }
        io.emit('rooms_update', rooms); // Update lobby
        break;
      }
    }
  });
});

server.listen(3001, () => {
  console.log('SERVER IS RUNNING ON PORT 3001');
});