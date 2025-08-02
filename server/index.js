// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const crypto = require('crypto');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://callbreak-hxwr.onrender.com";

const app = express();
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
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

// Card utilities
const SUITS = ["clubs", "diamonds", "hearts", "spades"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const rankValues = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  "7": 7, "8": 8, "9": 9, "10": 10,
  J: 11, Q: 12, K: 13, A: 14,
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function nextSeatClockwise(seat) {
  const order = ["North", "East", "South", "West"];
  const idx = order.indexOf(seat);
  return order[(idx + 1) % 4];
}

function determineTrickWinner(trick) {
  if (!trick || Object.values(trick).filter(c => c !== null).length === 0) return null;
  const played = Object.entries(trick).filter(([, card]) => card !== null);
  const leadSuit = played[0][1].suit;

  const spadesPlayed = played.filter(([, card]) => card.suit === "spades");
  let winner;
  if (spadesPlayed.length > 0) {
    winner = spadesPlayed.reduce((best, curr) => {
      return rankValues[curr[1].rank] > rankValues[best[1].rank] ? curr : best;
    });
  } else {
    const leadSuitPlays = played.filter(([, card]) => card.suit === leadSuit);
    if (leadSuitPlays.length > 0) {
      winner = leadSuitPlays.reduce((best, curr) => {
        return rankValues[curr[1].rank] > rankValues[best[1].rank] ? curr : best;
      });
    } else {
      winner = played[0];
    }
  }
  return winner ? winner[0] : null;
}

// In-memory room store
const rooms = {}; // roomId -> { players, createdAt, started, game }

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
        if (player) player.name = socket.data.playerName;
        // If game started, update seat name too
        if (room.started && room.game && room.game.seats) {
          for (const seatName of Object.keys(room.game.seats)) {
            if (room.game.seats[seatName].id === socket.id) {
              room.game.seats[seatName].name = socket.data.playerName;
            }
          }
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
      started: false,
      game: null,
    };
    socket.join(roomId);
    socket.emit("room_created", { roomId, room: rooms[roomId] });
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
      socket.emit("joined_room", { roomId, room });
      return;
    }

    if (room.players.length >= 4) {
      socket.emit("room_full", roomId);
      return;
    }

    socket.join(roomId);
    room.players.push({ id: socket.id, name: socket.data.playerName });

    socket.emit("joined_room", { roomId, room });
    io.emit("rooms_update", rooms);
    io.to(roomId).emit("room_update", room);

    // Start game when 4 players present
    if (room.players.length === 4 && !room.started) {
      room.started = true;

      // Random seat assignment
      const seatNames = ["North", "East", "South", "West"];
      const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);

      // Deal deck
      const deck = createDeck();
      shuffle(deck);
      const hands = [];
      for (let i = 0; i < 4; i++) {
        hands.push(deck.slice(i * 13, i * 13 + 13));
      }

      const seats = {};
      for (let i = 0; i < 4; i++) {
        seats[seatNames[i]] = {
          id: shuffledPlayers[i].id,
          name: shuffledPlayers[i].name,
          hand: hands[i],
        };
      }

      const startingSeat = seatNames[Math.floor(Math.random() * 4)];
      room.game = {
        seats,
        seatOrder: ["North", "East", "South", "West"],
        currentTurnSeat: startingSeat,
        spadesBroken: false,
        currentTrick: [],
        bids: { North: null, East: null, South: null, West: null },
        tricksWon: { North: 0, East: 0, South: 0, West: 0 },
      };

      console.log(`Game starting in room ${roomId}, starting seat: ${startingSeat}`);

      // Broadcast seating to everyone (names only)
      io.to(roomId).emit("seating", {
        seats: Object.fromEntries(
          Object.entries(seats).map(([seatName, data]) => [seatName, { name: data.name }])
        ),
        startingSeat,
      });

      // Send personalized game_started to each player
      for (const seatName of Object.keys(seats)) {
        const seatInfo = seats[seatName];
        const playerSocket = io.sockets.sockets.get(seatInfo.id);
        if (playerSocket) {
          playerSocket.emit("game_started", {
            roomId,
            yourSeat: seatName,
            seats: Object.fromEntries(
              Object.entries(seats).map(([sName, d]) => [sName, { name: d.name }])
            ),
            hand: seatInfo.hand,
            currentTurnSeat: room.game.currentTurnSeat,
            spadesBroken: room.game.spadesBroken,
            bids: room.game.bids,
            tricksWon: room.game.tricksWon,
          });
        }
      }
    }
  });

  socket.on("place_bid", ({ roomId, seat, bid }) => {
    const room = rooms[roomId];
    if (!room || !room.started || !room.game) return;
    if (!["North", "East", "South", "West"].includes(seat)) return;
    room.game.bids[seat] = bid;
    io.to(roomId).emit("bids_update", room.game.bids);

    const allBidsIn = Object.values(room.game.bids).every((b) => b !== null);
    if (allBidsIn) {
      io.to(roomId).emit("bidding_complete", room.game.bids);
    }
  });

  socket.on("play_card", ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room || !room.started || !room.game) return;

    const game = room.game;

    // Identify player's seat
    let playerSeat = null;
    for (const [seatName, info] of Object.entries(game.seats)) {
      if (info.id === socket.id) {
        playerSeat = seatName;
        break;
      }
    }
    if (!playerSeat) return;

    if (game.currentTurnSeat !== playerSeat) {
      socket.emit("invalid_move", { message: "Not your turn" });
      return;
    }

    const playerObj = game.seats[playerSeat];
    const hand = playerObj.hand;

    const cardIndex = hand.findIndex(
      (c) => c.suit === card.suit && c.rank === card.rank
    );
    if (cardIndex === -1) {
      socket.emit("invalid_move", { message: "Card not in hand" });
      return;
    }

    const isLeading = game.currentTrick.length === 0;
    const leadSuit = isLeading ? null : game.currentTrick[0].card.suit;

    if (isLeading) {
      if (card.suit === "spades" && !game.spadesBroken) {
        const hasNonSpade = hand.some((c) => c.suit !== "spades");
        if (hasNonSpade) {
          socket.emit("invalid_move", { message: "Cannot lead spades until broken" });
          return;
        }
      }
    } else {
      if (leadSuit && card.suit !== leadSuit) {
        const hasLeadSuit = hand.some((c) => c.suit === leadSuit);
        if (hasLeadSuit) {
          socket.emit("invalid_move", { message: `Must follow suit: ${leadSuit}` });
          return;
        }
      }
    }

    if (card.suit === "spades" && !game.spadesBroken) {
      game.spadesBroken = true;
      io.to(roomId).emit("spades_broken", true);
    }

    const playedCard = hand.splice(cardIndex, 1)[0];
    game.currentTrick.push({ seat: playerSeat, card: playedCard });

    if (game.currentTrick.length < 4) {
      game.currentTurnSeat = nextSeatClockwise(playerSeat);
      io.to(roomId).emit("trick_update", {
        currentTrick: game.currentTrick,
        currentTurnSeat: game.currentTurnSeat,
        handsRemaining: Object.fromEntries(
          Object.entries(game.seats).map(([sName, s]) => [sName, s.hand.length])
        ),
        tricksWon: game.tricksWon,
        bids: game.bids,
      });
      socket.emit("hand_update", { hand: game.seats[playerSeat].hand });
    } else {
      const completedTrick = [...game.currentTrick];
      const winnerSeat = determineTrickWinner(
        Object.fromEntries(
          completedTrick.map((t) => [t.seat, t.card])
        )
      );
      game.currentTurnSeat = winnerSeat;
      game.currentTrick = [];
      if (winnerSeat) {
        game.tricksWon[winnerSeat] += 1;
      }

      io.to(roomId).emit("trick_won", {
        winnerSeat,
        trick: completedTrick,
        currentTurnSeat: game.currentTurnSeat,
        handsRemaining: Object.fromEntries(
          Object.entries(game.seats).map(([sName, s]) => [sName, s.hand.length])
        ),
        tricksWon: game.tricksWon,
        bids: game.bids,
      });

      const winnerSocket = io.sockets.sockets.get(game.seats[winnerSeat]?.id);
      if (winnerSocket) {
        winnerSocket.emit("your_turn", { seat: winnerSeat });
      }

      // Update everyone’s hand
      for (const [seatName, info] of Object.entries(game.seats)) {
        const playerSock = io.sockets.sockets.get(info.id);
        if (playerSock) {
          playerSock.emit("hand_update", { hand: info.hand });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    let updated = false;
    for (const [roomId, room] of Object.entries(rooms)) {
      const playerIdx = room.players.findIndex((p) => p.id === socket.id);
      if (playerIdx !== -1) {
        room.players.splice(playerIdx, 1);
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
    if (updated) io.emit("rooms_update", rooms);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✔️ Multiplayer server is running on port ${PORT}`);
});
