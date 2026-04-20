// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import {
  initializeGame,
  playCard,
  legalMoves,
  generateAIBid,
  generateAICardPlay,
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

// roomId -> { players: Map<socketId, { id, socketId, name, seat }>, gameState }
const rooms = new Map();

// Counter for multiplayer matchmaking rooms
let multiplayerRoomCounter = 0;

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

  socket.on("join_multiplayer_queue", () => {
    console.log("\n=== JOIN_MULTIPLAYER_QUEUE RECEIVED ===");
    console.log("Player:", socket.id, socket.data.name);

    // Always try to find an existing multiplayer matchmaking room first
    let room = null;
    let roomId = null;

    // Look for an existing multiplayer room with available slots
    for (const [id, r] of rooms.entries()) {
      if (r.mode === "multiplayer" && r.players.size < 4 && !r.gameState) {
        room = r;
        roomId = id;
        console.log(`Found existing room: ${roomId} with ${r.players.size} players`);
        break;
      }
    }

    // If no available room, create a new matchmaking room
    if (!room) {
      multiplayerRoomCounter++;
      roomId = `match-${multiplayerRoomCounter}`;
      room = {
        roomId,
        mode: "multiplayer",
        pin: null,
        players: new Map(),
        gameState: null,
        aiPlayers: new Set(),
        aiTimers: {},
        hostSocketId: null,
        roundNumber: 0,  // Track which round we're on (will be incremented to 1 when game starts)
      };
      rooms.set(roomId, room);
      console.log(`Created new matchmaking room: ${roomId}`);
    }

    // Check if player is already in this room
    if (room.players.has(socket.id)) {
      console.log(`Player ${socket.id} already in room ${roomId}`);
      return;
    }

    // Add player to room
    room.players.set(socket.id, {
      id: socket.id,
      socketId: socket.id,
      name: socket.data.name,
      seat: null,
    });
    socket.join(roomId);
    const assignedSeat = assignSeat(room, socket.id);

    console.log(`Player ${socket.id} joined room ${roomId}, assigned seat: ${assignedSeat}, total players: ${room.players.size}`);

    // Emit assigned seat to this specific player
    console.log(`Emitting assigned_seat to player ${socket.id}: ${assignedSeat}`);
    socket.emit("assigned_seat", { seat: assignedSeat, roomId });

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    console.log(`Emitting room_update to ${roomId} with ${playersList.length} players:`, playersList);
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();

    // Auto-start when 4 players join
    console.log(`Checking auto-start condition: players=${room.players.size}, gameState=${!!room.gameState}`);
    if (room.players.size === 4 && !room.gameState) {
      console.log(`✓ Room ${roomId} has 4 players, scheduling game start in 500ms...`);
      setTimeout(() => {
        console.log(`Auto-start timeout fired for room ${roomId}`);
        if (room.players.size === 4 && !room.gameState) {
          console.log(`✓ Conditions still met, starting game`);
          startGameWithAI(room, io, roomId);
        } else {
          console.log(`✗ Conditions no longer met. players=${room.players.size}, gameState=${!!room.gameState}`);
        }
      }, 500);
    } else {
      console.log(`✗ Auto-start conditions not met (need 4 players and no gameState)`);
    }
    console.log(`=== END JOIN_MULTIPLAYER_QUEUE ===\n`);
  });

  socket.on("create_room", (data) => {
    const { mode = "multiplayer", pin = null } = data || {};

    // For multiplayer, use the dedicated queue handler instead
    if (mode === "multiplayer") {
      socket.emit("join_multiplayer_queue");
      return;
    }

    // For other modes, create a new unique room
    const roomId = nano();
    const room = {
      roomId,
      mode,
      pin: mode === "private_table" ? pin : null,
      players: new Map(),
      gameState: null,
      aiPlayers: new Set(),
      aiTimers: {},
      hostSocketId: socket.id,
      roundNumber: 0,  // Track which round we're on
    };
    rooms.set(roomId, room);

    // Add player to room
    room.players.set(socket.id, {
      id: socket.id,
      socketId: socket.id,
      name: socket.data.name,
      seat: null,
    });
    socket.join(roomId);
    assignSeat(room, socket.id);

    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat, roomId });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();
  });

  socket.on("create_singleplayer_game", () => {
    const roomId = nano();
    const humanPlayer = {
      id: socket.id,
      socketId: socket.id,
      name: socket.data.name,
      seat: "south",
    };
    const room = {
      roomId,
      mode: "singleplayer",
      pin: null,
      players: new Map([[socket.id, humanPlayer]]),
      gameState: null,
      aiPlayers: new Set(["north", "east", "west"]),
      aiTimers: {},
      hostSocketId: socket.id,
      roundNumber: 0,  // Track which round we're on
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit("assigned_seat", { seat: "south", roomId });

    // Auto-start with AI players
    setTimeout(() => {
      if (!room.gameState) {
        startGameWithAI(room, io, roomId);
      }
    }, 500);

    broadcastLobby();
  });

  socket.on("create_private_table", ({ pin }) => {
    const roomId = nano();
    const room = {
      roomId,
      mode: "private_table",
      pin,
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
      aiPlayers: new Set(),
      aiTimers: {},
      hostSocketId: socket.id,
      roundNumber: 0,  // Track which round we're on
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    assignSeat(room, socket.id);

    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat, roomId, pin });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();
  });

  socket.on("join_private_table", ({ roomId, pin }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    if (room.mode !== "private_table" || room.pin !== pin) {
      socket.emit("error", "Invalid PIN");
      return;
    }
    if (room.players.size >= 4) {
      socket.emit("error", "Room is full");
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

    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat, roomId });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();
  });

  socket.on("join_hotspot", () => {
    // Find a room with mode = hotspot that has <4 players and hasn't started
    let room = null;
    for (const [roomId, r] of rooms.entries()) {
      if (r.mode === "hotspot" && r.players.size < 4 && !r.gameState) {
        room = r;
        break;
      }
    }

    // If no available room, create one
    if (!room) {
      const roomId = nano();
      room = {
        roomId,
        mode: "hotspot",
        pin: null,
        players: new Map(),
        gameState: null,
        aiPlayers: new Set(),
        aiTimers: {},
        hostSocketId: null,
        roundNumber: 0,  // Track which round we're on
      };
      rooms.set(roomId, room);
    }

    const roomId = room.roomId;
    room.players.set(socket.id, {
      id: socket.id,
      socketId: socket.id,
      name: socket.data.name,
      seat: null,
    });
    socket.join(roomId);
    assignSeat(room, socket.id);

    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat, roomId });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));
    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();

    // Auto-start when 4 players join
    if (room.players.size === 4 && !room.gameState) {
      setTimeout(() => {
        if (room.players.size === 4 && !room.gameState) {
          startGameWithAI(room, io, roomId);
        }
      }, 500);
    }
  });

  socket.on("start_game_host", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id || room.gameState) return;

    // Fill remaining seats with AI
    const takenSeats = new Set(
      Array.from(room.players.values())
        .map((p) => p.seat)
        .filter((s) => s !== null)
    );
    for (const seat of SEAT_ORDER) {
      if (!takenSeats.has(seat)) {
        room.aiPlayers.add(seat);
      }
    }

    startGameWithAI(room, io, roomId);
  });

  socket.on("join_room", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    if (room.mode !== "multiplayer") {
      socket.emit("error", "Can only join multiplayer rooms this way");
      return;
    }
    if (room.players.size >= 4) {
      socket.emit("error", "Room is full");
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

    const player = room.players.get(socket.id);
    if (player && player.seat) {
      socket.emit("assigned_seat", { seat: player.seat, roomId });
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));

    io.to(roomId).emit("room_update", { roomId, players: playersList });
    broadcastLobby();

    // Auto-start when 4 players join (for multiplayer mode)
    if (room.players.size === 4 && !room.gameState) {
      setTimeout(() => {
        if (room.players.size === 4 && !room.gameState) {
          startGameWithAI(room, io, roomId);
        }
      }, 500);
    }
  });

  socket.on("place_bid", ({ roomId, bid }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const player = room.players.get(socket.id);
    if (!player || !player.seat) return;
    room.gameState.bids[player.seat] = bid;
    io.to(roomId).emit("game_state_update", room.gameState);

    // Check if all players have bid
    const allBidded = Object.values(room.gameState.bids).every((b) => b !== undefined && b !== 0 || room.gameState.bids[room.gameState.turn] !== undefined);
    if (allBidded && room.aiPlayers.size > 0) {
      // Schedule next AI bid if needed
      scheduleNextAIAction(room, io, roomId, "bid");
    }
  });

  socket.on("deal_next_hand", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    console.log("Dealing next hand for room:", roomId);

    // Increment round number for the next hand
    room.roundNumber = (room.roundNumber || 1) + 1;
    console.log(`[Room ${roomId}] Dealing Round ${room.roundNumber}`);

    // Initialize new game state for the next hand
    room.gameState = initializeGame();
    // Update the game state with the correct round number
    room.gameState.round = room.roundNumber;

    // Get seating info for the new hand
    const seating = getSeatingInfo(room);
    for (const aiSeat of room.aiPlayers) {
      seating[aiSeat] = {
        name: "AI Bot",
        isAI: true,
      };
    }

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.socketId,
      name: p.name,
      seat: p.seat,
    }));

    // Broadcast the new game state to all players
    io.to(roomId).emit("start_game", {
      room: { id: roomId, players: playersList },
      initialGameState: room.gameState,
      seating,
    });

    console.log("New hand started for room:", roomId);
  });

  socket.on("play_card", ({ roomId, card }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const player = room.players.get(socket.id);
    if (!player || !player.seat) return;

    const allowed = legalMoves(room.gameState, player.seat);
    const isLegal = allowed.some((c) => c.suit === card.suit && c.rank === card.rank);
    if (!isLegal) return;

    playCard(room.gameState, player.seat, card);
    io.to(roomId).emit("game_state_update", room.gameState);

    // Schedule next AI action if needed
    if (room.aiPlayers.size > 0) {
      scheduleNextAIAction(room, io, roomId, "play");
    }
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

        // Clean up AI timers
        if (room.aiTimers) {
          Object.values(room.aiTimers).forEach((timer) => clearTimeout(timer));
          room.aiTimers = {};
        }

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

// Helper function to start a game with AI bots
function startGameWithAI(room, io, roomId) {
  console.log("\n=== STARTING GAME WITH AI ===");
  console.log("Room:", roomId, "Players:", room.players.size);

  if (room.gameState) {
    console.log("Game already started, returning");
    return; // Already started
  }

  // Increment round number for this game start
  room.roundNumber = (room.roundNumber || 0) + 1;
  console.log(`[Room ${roomId}] Starting Round ${room.roundNumber}`);

  room.gameState = initializeGame();
  // Update the game state with the correct round number
  room.gameState.round = room.roundNumber;
  console.log("Game state initialized");

  // Add AI player info to seating
  const seating = getSeatingInfo(room);
  for (const aiSeat of room.aiPlayers) {
    seating[aiSeat] = {
      name: "AI Bot",
      isAI: true,
    };
  }

  const playersList = Array.from(room.players.values()).map((p) => ({
    id: p.socketId,
    name: p.name,
    seat: p.seat,
  }));

  console.log("Emitting start_game to room:", roomId);
  console.log("Players:", playersList);
  console.log("Seating:", seating);
  console.log("Game State:", room.gameState);

  io.to(roomId).emit("start_game", {
    room: { id: roomId, players: playersList },
    initialGameState: room.gameState,
    seating,
  });

  console.log("start_game emitted successfully");

  // Schedule first AI action if needed
  scheduleNextAIAction(room, io, roomId, "bid");
  console.log("=== END STARTING GAME ===\n");
}

// Helper function to schedule the next AI action (bid or play card)
function scheduleNextAIAction(room, io, roomId, phase) {
  if (!room.gameState || !room.aiPlayers.has(room.gameState.turn)) return;

  const aiSeat = room.gameState.turn;
  const delay = phase === "bid" ? 1000 : 800;

  // Clear any existing timer for this AI
  if (room.aiTimers[aiSeat]) {
    clearTimeout(room.aiTimers[aiSeat]);
  }

  room.aiTimers[aiSeat] = setTimeout(() => {
    if (!room.gameState) return;

    if (phase === "bid") {
      executeAIBid(room, io, roomId, aiSeat);
    } else if (phase === "play") {
      executeAICardPlay(room, io, roomId, aiSeat);
    }
  }, delay);
}

// Helper function to execute AI bid
function executeAIBid(room, io, roomId, aiSeat) {
  if (room.gameState.bids[aiSeat] !== undefined) return; // Already bid

  const hand = room.gameState.hands[aiSeat];
  const bid = generateAIBid(hand);
  room.gameState.bids[aiSeat] = bid;

  io.to(roomId).emit("game_state_update", room.gameState);

  // Move to next player
  const seatIdx = SEAT_ORDER.indexOf(aiSeat);
  const nextIdx = (seatIdx + 1) % SEAT_ORDER.length;
  const nextSeat = SEAT_ORDER[nextIdx];
  room.gameState.turn = nextSeat;

  // Check if bidding is complete
  const allBidded = SEAT_ORDER.every((seat) => room.gameState.bids[seat] !== undefined);
  if (!allBidded && room.aiPlayers.has(nextSeat)) {
    scheduleNextAIAction(room, io, roomId, "bid");
  } else if (allBidded) {
    // Bidding done, start card play phase
    io.to(roomId).emit("bidding_complete", { gameState: room.gameState });
    if (room.aiPlayers.has(room.gameState.turn)) {
      scheduleNextAIAction(room, io, roomId, "play");
    }
  }
}

// Helper function to execute AI card play
function executeAICardPlay(room, io, roomId, aiSeat) {
  if (room.gameState.turn !== aiSeat) return; // Not AI's turn

  const hand = room.gameState.hands[aiSeat];
  if (hand.length === 0) return; // No cards left

  const legalCards = legalMoves(room.gameState, aiSeat);
  const cardToPlay = generateAICardPlay(room.gameState, aiSeat, legalCards);

  if (cardToPlay) {
    playCard(room.gameState, aiSeat, cardToPlay);
    io.to(roomId).emit("game_state_update", room.gameState);

    // Schedule next action if it's still an AI's turn
    if (room.aiPlayers.has(room.gameState.turn)) {
      scheduleNextAIAction(room, io, roomId, "play");
    }
  }
}

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log("Server listening on", PORT);
});
