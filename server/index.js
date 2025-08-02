// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const crypto = require('crypto');

// Frontend origin (set this in your Render or env when running locally)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://callbreak-hxwr.onrender.com";

const app = express();

// CORS for frontend
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Health check
app.get("/", (req, res) => res.send("✔️ Multiplayer server is alive"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// In-memory rooms store
const rooms = {}; // roomId -> { players: [{ id, name }], createdAt }

function makeRoomId() {
  return crypto.randomBytes(3).toString("hex");
}

function findRoomContainingSocket(socketId) {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.players.some((p) => p.id === socketId)) {
      return { roomId, room };
    }
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.data.playerName = `Player_${socket.id.slice(0, 5)}`;

  socket.on("set_player_name", (name) => {
    if (typeof name === "string" && name.trim()) {
      socket.data.playerName = name.trim();
      const found = findRoomContainingSocket(socket.id);
      if (found) {
        const { roomId, room } = found;
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.name = socket.data.playerName;
        }
        io.to(roomId).emit("room_update", room);
        io.emit("rooms_update", rooms);
      }
    }
  });

  socket.on("create_room", () => {
    const roomId = makeRoomId();
    rooms[roomId] = {
      players: [{ id: socket.id, name: socket.data.playerName }],
      createdAt: Date.now(),
    };
    socket.join(roomId);
    io.emit("rooms_update", rooms);
    console.log(`Room created: ${roomId} by ${socket.data.playerName}`);
  });

  socket.on("join_room", (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room does not exist", roomId });
      return;
    }

    if (room.players.find((p) => p.id === socket.id)) {
      return; // already in
    }

    if (room.players.length >= 4) {
      socket.emit("room_full", roomId);
      return;
    }

    socket.join(roomId);
    room.players.push({ id: socket.id, name: socket.data.playerName });

    if (room.players.length === 4) {
      console.log(`Game starting in room ${roomId}`);
      io.to(roomId).emit("start_game", {
        message: "All players are in! The game will now begin.",
        room,
      });
    } else {
      io.to(roomId).emit("room_update", room);
    }

    io.emit("rooms_update", rooms);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    let updated = false;

    for (const [roomId, room] of Object.entries(rooms)) {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          io.to(roomId).emit("room_update", room);
        }
        updated = true;
        break;
      }
    }

    if (updated) {
      io.emit("rooms_update", rooms);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✔️ Multiplayer server is running on port ${PORT}`);
});
