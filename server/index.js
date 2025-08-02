const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the client-side file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const rooms = {};
const ROOM_CAPACITY = 4;

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // When a player wants to join a room
    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);

        // Create the room if it doesn't exist
        if (!rooms[roomName]) {
            rooms[roomName] = { players: {} };
        }

        // Add the new player to the room
        rooms[roomName].players[socket.id] = {
            id: socket.id,
            // You can add more player data here, e.g., username
        };

        const playerCount = Object.keys(rooms[roomName].players).length;
        console.log(`Player ${socket.id} joined ${roomName}. Room now has ${playerCount} players.`);

        // Notify all players in the room about the new player count
        io.to(roomName).emit('playerCountUpdate', playerCount);

        // Check if the room is full and start the game
        if (playerCount === ROOM_CAPACITY) {
            console.log(`Room ${roomName} is full. Starting game.`);
            // Send a message to everyone in the room to start the game
            io.to(roomName).emit('gameStart', { message: `Let the game begin!` });
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`A user disconnected: ${socket.id}`);
        // Find which room the player was in and remove them
        for (const roomName in rooms) {
            if (rooms[roomName].players[socket.id]) {
                delete rooms[roomName].players[socket.id];
                const playerCount = Object.keys(rooms[roomName].players).length;
                console.log(`Player ${socket.id} left ${roomName}. Room now has ${playerCount} players.`);

                // Notify remaining players of the change
                io.to(roomName).emit('playerCountUpdate', playerCount);

                // If the room is now empty, you could delete it
                if (playerCount === 0) {
                    delete rooms[roomName];
                    console.log(`Room ${roomName} is now empty and has been closed.`);
                }
                break;
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});