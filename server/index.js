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
    origin: "*", // Allows connections from any origin, including your Render frontend
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
    // Generate a unique Room ID
    const roomId = `room_${socket.id}`;
    // Create the room object
    rooms[roomId] = {
        id: roomId,
        players: [],
        gameState: null // Game state will be added later
    };
    // Have the socket join the room
    socket.join(roomId);
    // Add the creator as the first player
    rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

    // Send confirmation to the player that they have joined the room
    socket.emit('joined_room', rooms[roomId]);
    
    // Send the updated room list to everyone in the lobby
    io.emit('rooms_update', rooms);
    console.log(`Room created: ${roomId} by ${socket.data.playerName}`);
  });

  // When a player clicks "Join" on an existing room
  socket.on('join_room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

      // If the room is now full, trigger the game to start for everyone in that room
      if (rooms[roomId].players.length === 4) {
        console.log(`Game starting in room ${roomId}`);
        io.to(roomId).emit('start_game', {
          message: 'All players are in! The game will now begin.',
          room: rooms[roomId]
        });
      } else {
        // If the room is not yet full, just update its state for all players inside it
        io.to(roomId).emit('room_update', rooms[roomId]);
      }

      // Update the lobby list for everyone
      io.emit('rooms_update', rooms);
    }
  });

  // Handle player disconnections
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        // Remove the player from the room
        room.players.splice(playerIndex, 1);
        
        // If the room is now empty, delete it
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          // Otherwise, notify the remaining players
          io.to(roomId).emit('room_update', room);
        }
        
        // Update the lobby for everyone
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