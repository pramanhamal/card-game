// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";

const app = express();
const server = http.createServer(app);

const SEAT_ORDER = ["north", "east", "south", "west"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUITS = ["clubs","diamonds","hearts","spades"];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealHands() {
  const deck = shuffle(createDeck());
  return {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
}

// In-memory rooms
const rooms = new Map(); // roomId -> room state

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: ["https://callbreak-hxwr.onrender.com"], // front-end origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

function capitalizeSeat(seat) {
  return seat[0].toUpperCase() + seat.slice(1);
}

function broadcastLobby() {
  const simplified = {};
  for (const [roomId, room] of rooms.entries()) {
    simplified[roomId] = {
      players: Array.from(room.players.values()).map(p => ({ id: p.socketId, name: p.name })),
      started: !!room.started,
    };
  }
  io.emit("rooms_update", simplified);
}

function assignSeatsByJoinOrder(playerEntries) {
  const seating = {};
  for (let i = 0; i < playerEntries.length && i < 4; i++) {
    const seat = SEAT_ORDER[i];
    seating[seat] = {
      socketId: playerEntries[i].socketId,
      name: playerEntries[i].name,
    };
  }
  return seating;
}

io.on("connection", (socket) => {
  socket.data.name = `Anon-${socket.id.slice(0,4)}`;
  console.log("connected:", socket.id);
  broadcastLobby();

  socket.on("set_player_name", (name) => {
    socket.data.name = name;
  });

  socket.on("create_room", () => {
    const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
    const roomId = nano();
    const room = {
      players: new Map(),
      started: false,
      seating: null,
      hands: null,
      currentTurn: null,
      tricksWon: { north: 0, east: 0, south: 0, west: 0 },
      bids: { north: null, east: null, south: null, west: null },
      spadesBroken: false,
    };
    rooms.set(roomId, room);
    room.players.set(socket.id, { socketId: socket.id, name: socket.data.name, seat: null });
    socket.join(roomId);
    socket.emit("room_created", { roomId, room: { players: [{ id: socket.id, name: socket.data.name }] } });
    broadcastLobby();
  });

  socket.on("join_room", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    if (room.started) {
      socket.emit("error", "Game already started");
      return;
    }
    room.players.set(socket.id, { socketId: socket.id, name: socket.data.name, seat: null });
    socket.join(roomId);
    const playersList = Array.from(room.players.values()).map(p => ({ id: p.socketId, name: p.name }));
    io.to(roomId).emit("room_update", { players: playersList });
    socket.emit("joined_room", { roomId, room: { players: playersList } });
    broadcastLobby();

    if (room.players.size === 4) {
      // start game
      const entries = Array.from(room.players.values());
      const seating = assignSeatsByJoinOrder(entries);
      room.seating = seating;
      room.hands = dealHands();
      room.currentTurn = SEAT_ORDER[Math.floor(Math.random() * 4)];
      room.started = true;
      room.tricksWon = { north: 0, east: 0, south: 0, west: 0 };
      room.bids = { north: null, east: null, south: null, west: null };
      room.spadesBroken = false;

      for (const seat of SEAT_ORDER) {
        const seatInfo = seating[seat];
        if (!seatInfo) continue;
        const targetSocketId = seatInfo.socketId;
        const yourSeat = capitalizeSeat(seat); // "South" etc.
        const payload = {
          yourSeat,
          seats: {
            North: { name: seating.north.name },
            East: { name: seating.east.name },
            South: { name: seating.south.name },
            West: { name: seating.west.name },
          },
          hand: room.hands[seat],
          currentTurnSeat: capitalizeSeat(room.currentTurn),
          tricksWon: {
            North: room.tricksWon.north,
            East: room.tricksWon.east,
            South: room.tricksWon.south,
            West: room.tricksWon.west,
          },
          bids: {
            North: room.bids.north,
            East: room.bids.east,
            South: room.bids.south,
            West: room.bids.west,
          },
          spadesBroken: room.spadesBroken,
        };
        io.to(targetSocketId).emit("game_started", payload);
      }

      const updatedPlayers = Array.from(room.players.values()).map(p => ({ id: p.socketId, name: p.name }));
      io.to(roomId).emit("room_update", { players: updatedPlayers });
      broadcastLobby();
    }
  });

  socket.on("play_card", ({ roomId, card }) => {
    const room = rooms.get(roomId);
    if (!room || !room.started) return;
    // simplistic broadcast of played card, real logic would update trick/winner
    let playerSeat = null;
    if (room.seating) {
      for (const seat of SEAT_ORDER) {
        if (room.seating[seat]?.socketId === socket.id) {
          playerSeat = seat;
          break;
        }
      }
    }
    if (!playerSeat) return;

    const trickUpdate = [{ seat: capitalizeSeat(playerSeat), card }];
    io.to(roomId).emit("trick_update", {
      currentTrick: trickUpdate,
      currentTurnSeat: capitalizeSeat(room.currentTurn),
      tricksWon: {
        North: room.tricksWon.north,
        East: room.tricksWon.east,
        South: room.tricksWon.south,
        West: room.tricksWon.west,
      },
      bids: {
        North: room.bids.north,
        East: room.bids.east,
        South: room.bids.south,
        West: room.bids.west,
      },
      spadesBroken: room.spadesBroken,
    });
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        const remaining = Array.from(room.players.values()).map(p => ({ id: p.socketId, name: p.name }));
        io.to(roomId).emit("room_update", { players: remaining });
        if (room.players.size === 0) {
          rooms.delete(roomId);
        } else {
          room.started = false;
        }
        broadcastLobby();
        break;
      }
    }
    console.log("disconnected:", socket.id);
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("listening on", PORT);
});
