// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import {
  initializeGame,
  playCard,
  evaluateTrick,
  calculateScores,
} from "../src/utils/gameLogic.js"; // adjust path if compiled

// NOTE: If you compile TS to JS, adjust imports. This assumes ESM.

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: ["https://callbreak-hxwr.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory room store
/** roomId -> { players: Map<socketId, { socketId, name }>, gameState: GameState | null } */
const rooms = new Map();

function broadcastLobby() {
  const summary = {};
  for (const [roomId, room] of rooms.entries()) {
    summary[roomId] = {
      players: Array.from(room.players.values()).map((p) => ({
        id: p.socketId,
        name: p.name,
      })),
      hasStarted: !!room.gameState,
    };
  }
  io.emit("rooms_update", summary);
}

io.on("connection", (socket) => {
  socket.data.name = `Anon-${socket.id.slice(0, 4)}`;
  broadcastLobby();

  socket.on("set_player_name", (name) => {
    socket.data.name = name;
  });

  socket.on("create_room", () => {
    const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
    const roomId = nano();
    rooms.set(roomId, {
      players: new Map([[socket.id, { socketId: socket.id, name: socket.data.name }]]),
      gameState: null,
    });
    socket.join(roomId);
    io.to(roomId).emit("room_update", {
      roomId,
      players: [{ id: socket.id, name: socket.data.name }],
    });
    broadcastLobby();
  });

  socket.on("join_room", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    room.players.set(socket.id, { socketId: socket.id, name: socket.data.name });
    socket.join(roomId);
    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
    }));
    io.to(roomId).emit("player_joined", { id: socket.id, name: socket.data.name });
    io.to(roomId).emit("room_update", {
      roomId,
      players: playersList,
    });
    socket.emit("joined_room", { roomId, room: { players: playersList } });
    broadcastLobby();

    // auto-start when 4 players
    if (room.players.size === 4 && !room.gameState) {
      const gameState = initializeGame();
      room.gameState = gameState;
      // broadcast start_game with full state to all in room
      io.to(roomId).emit("start_game", {
        room: {
          id: roomId,
          players: playersList,
        },
        initialGameState: gameState,
      });
      broadcastLobby();
    }
  });

  socket.on("place_bid", ({ roomId, playerId, bid }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    room.gameState.bids[playerId] = bid;
    // broadcast updated game state
    io.to(roomId).emit("game_state_update", room.gameState);
  });

  socket.on("play_card", ({ roomId, playerId, card }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    // apply play
    playCard(room.gameState, playerId, card);
    // if trick just completed, evaluate trick (internal to playCard)
    // optional: if hand finished, compute final scores
    io.to(roomId).emit("game_state_update", room.gameState);
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        const playersList = Array.from(room.players.values()).map((p) => ({
          id: p.socketId,
          name: p.name,
        }));
        io.to(roomId).emit("room_update", { roomId, players: playersList });
        if (room.players.size === 0) {
          rooms.delete(roomId);
        } else {
          room.gameState = null; // optional: pause/reset
        }
        broadcastLobby();
        break;
      }
    }
  });

  // health
  socket.on("request_state", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.gameState) {
      socket.emit("game_state_update", room.gameState);
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server listening on", PORT));
