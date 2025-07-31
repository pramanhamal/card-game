// projectRoot/server/index.js

const express = require("express");
const http = require("http");
const { Server: IOServer } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Change this to your actual front-end URL
const FRONTEND_ORIGIN = "https://callbreak-hxwr.onrender.com";
const PORT = process.env.PORT || 3000;

const app = express();

// 1) Enable CORS on all HTTP routes (including polling errors)
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// 2) Create the HTTP server and _then_ bind Socket.IO
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // allow both polling (handshake) and websocket upgrade
  transports: ["polling", "websocket"],
});

// 3) Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("↔️  Client connected:", socket.id);

  socket.on("join_lobby", (playerName) => {
    // example: emit all rooms back to everyone
    // io.emit("rooms_update", currentRooms);
  });

  socket.on("create_room", () => {
    // create a room, then:
    // io.emit("rooms_update", updatedRooms);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    // send back your room details
    // socket.emit("joined_room", roomDetails);
    // broadcast update
    // io.to(roomId).emit("room_update", roomDetails);
  });

  socket.on("start_game", () => {
    // io.emit("start_game", { room: roomDetails });
  });

  socket.on("disconnect", () => {
    console.log("❌  Client disconnected:", socket.id);
  });
});

// 4) (Optional) if you’ve built your React app into client/dist, serve it _after_ Socket.IO:
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);

// 5) Finally, start listening
httpServer.listen(PORT, () => {
  console.log(`🚀  Server listening on port ${PORT}`);
});
