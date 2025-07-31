// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Set up Socket.IO with CORS settings to allow your React app to connect
const io = new Server(server, {
  cors: {
    origin: "*", // Make sure this matches your React app's URL
    methods: ["GET", "POST"]
  }
});

let rooms = {}; // This object will store all active game rooms

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // When a player provides their name and enters the lobby
  socket.on('join_lobby', (playerName) => {
    socket.data.playerName = playerName;
    // Send the current list of rooms to the newly connected player
    socket.emit('rooms_update', rooms);
  });

  // When a player clicks "Create Room"
  socket.on('create_room', () => {
    const roomId = `room_${socket.id}`;
    rooms[roomId] = { players: [], gameState: null, id: roomId };
    socket.join(roomId);
    rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

    socket.emit('joined_room', rooms[roomId]); // Tell the player they've joined
    io.emit('rooms_update', rooms); // Send the updated room list to everyone in the lobby
    console.log(`Room created: ${roomId} by ${socket.data.playerName}`);
  });

  // When a player clicks "Join" on a room
  socket.on('join_room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

      // If the room is now full, trigger the game to start
      if (rooms[roomId].players.length === 4) {
        console.log(`Game starting in room ${roomId}`);
        // In a full implementation, you would initialize the game state here
        // and send it to all players.
        io.to(roomId).emit('start_game', {
          message: 'All players are in! The game will now begin.',
          room: rooms[roomId]
        });
      } else {
        // If the room is not yet full, just update its state for all players inside it
        io.to(roomId).emit('room_update', rooms[roomId]);
      }

      io.emit('rooms_update', rooms); // Update the lobby for everyone
    }
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Find which room the player was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId]; // Delete the room if it's empty
        } else {
          io.to(roomId).emit('room_update', room); // Notify others in the room
        }
        io.emit('rooms_update', rooms); // Update the lobby
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✔️ Server is running on http://localhost:${PORT}`);
});