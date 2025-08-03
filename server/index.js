// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import {
  initializeGame,
  playCard,
} from "./utils/gameLogic.js";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: ["https://callbreak-hxwr.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const SEAT_ORDER = ["north", "east", "south", "west"];
const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

// Structure: roomId -> { players: Map<socketId, { id, socketId, name, seat }>, gameState }
const rooms = new Map();

function broadcastLobby() {
  const summary = {};
  for (const [roomId, room] of rooms.entries()) {
    summary[roomId] = {
      players: Array.from(room.players.values()).map((p) => ({
        id: p.socketId,
        name: p.name,
        seat: p.seat,
      })),
      hasStarted: !!room.gameState,
    };
  }
  io.emit("rooms_update", summary);
}

function assignSeat(room, socketId) {
  const taken = new Set(Array.from(room.players.values()).map((p) => p.seat));
  for (const seat of SEAT_ORDER) {
    if (!taken.has(seat)) {
      const player = room.players.get(socketId);
      if (player) player.seat = seat;
      return seat;
    }
  }
  return null;
}

function getSeatingInfo(room) {
  const seating = {};
  for (const p of room.players.values()) {
    if (!p.seat) continue;
    seating[p.seat] = {
      name: p.name,
      isAI: false,
    };
  }
  return seating;
}

io.on("connection", (socket) => {
  socket.data.name = `Anon-${socket.id.slice(0, 4)}`;
  broadcastLobby();

  socket.on("set_player_name", (name) => {
    socket.data.name = name;
  });

  socket.on("create_room", () => {
    const roomId = nano();
    const room = {
      players: new Map([
        [
          socket.id,
          {
            id: socket.id,
            socketId: socket.id,
            name: socket.data.name,
            seat: null,
          },
        ],
      ]),
      gameState: null,
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    assignSeat(room, socket.id);

    // send assigned seat to creator
    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();
  });

  socket.on("join_room", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    room.players.set(socket.id, {
      id: socket.id,
      socketId: socket.id,
      name: socket.data.name,
      seat: null,
    });
    socket.join(roomId);
    assignSeat(room, socket.id);

    // send assigned seat to this joiner
    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));

    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();

    if (room.players.size === 4 && !room.gameState) {
      const gameState = initializeGame();
      room.gameState = gameState;

      io.to(roomId).emit("start_game", {
        room: { id: roomId, players: playersList },
        initialGameState: gameState,
        seating: getSeatingInfo(room),
      });
    }
  });

  socket.on("place_bid", ({ roomId, playerId, bid }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    room.gameState.bids[playerId] = bid;
    io.to(roomId).emit("game_state_update", room.gameState);
  });

  socket.on("play_card", ({ roomId, playerId, card }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    playCard(room.gameState, playerId, card);
    io.to(roomId).emit("game_state_update", room.gameState);
  });

  socket.on("request_state", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.gameState) {
      io.to(socket.id).emit("game_state_update", room.gameState);
    }
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        const playersList = Array.from(room.players.values()).map((p) => ({
          id: p.socketId,
          name: p.name,
          seat: p.seat,
        }));
        io.to(roomId).emit("room_update", { roomId, players: playersList });
        if (room.players.size === 0) {
          rooms.delete(roomId);
        } else {
          room.gameState = null;
        }
        broadcastLobby();
        break;
      }
    }
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log("Server listening on", PORT);
});
