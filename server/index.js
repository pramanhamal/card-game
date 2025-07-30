// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Use the cors middleware to allow cross-origin requests

const server = http.createServer(app);

// Initialize Socket.IO with CORS settings to allow your frontend to connect
const io = new Server(server, {
  cors: {
    origin: "*", // Allows all origins for simplicity. For production, you can restrict this to your frontend's URL.
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
    rooms[roomId] = { id: roomId, players: [], gameState: null };
    
    // Have the creator join the Socket.IO room
    socket.join(roomId);
    
    // Add the creator to the list of players in the room
    rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });
    
    // Let the creator know they've successfully joined
    socket.emit('joined_room', rooms[roomId]);
    
    // Update the lobby for all other connected clients
    io.emit('rooms_update', rooms);
    console.log(`Room created: ${roomId} by ${socket.data.playerName}`);
  });

  // When a player clicks "Join" on an existing room
  socket.on('join_room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: socket.data.playerName });

      // If the room is now full, start the game for everyone in it
      if (rooms[roomId].players.length === 4) {
        console.log(`Game starting in room ${roomId}`);
        // In a real game, you would initialize the GameState here and send it
        io.to(roomId).emit('start_game', { room: rooms[roomId] });
      } else {
        // Otherwise, just update the room for the other players
        io.to(roomId).emit('room_update', rooms[roomId]);
      }
      
      // Update the lobby for all clients
      io.emit('rooms_update', rooms);
    }
  });

  // Handle player disconnections
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Find which room the player was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        // If the room is now empty, delete it
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          // Otherwise, notify the remaining players in the room
          io.to(roomId).emit('room_update', room);
        }
        
        // Update the lobby for everyone
        io.emit('rooms_update', rooms);
        break; // Exit the loop once the player is found and handled
      }
    }
  });
});

// Use the PORT environment variable provided by Render, with a fallback for local development
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✔️ Multiplayer server is running on port ${PORT}`);
});