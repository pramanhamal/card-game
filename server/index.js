// projectRoot/server/index.js

const express = require("express");
const http = require("http");
const { Server: IOServer } = require("socket.io");
const cors = require("cors");
const path = require("path");

const FRONTEND_ORIGIN = "https://callbreak-hxwr.onrender.com";
const PORT = process.env.PORT || 3000;

const app = express();

// 1) Log every request (for debugging)
app.use((req, res, next) => {
  console.log("📥", req.method, req.url);
  next();
});

// 2) Enable CORS globally (even on errors)
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// 3) Explicit health-check route so GET / returns 200
app.get("/", (req, res) => {
  res.send("Socket.IO + CORS server is up");
});

// 4) (Optional) serve your React build once you `npm run build`
//    Uncomment these after you have `client/dist/index.html`
// app.use(express.static(path.join(__dirname, "../client/dist")));
// app.get("*", (req, res) =>
//   res.sendFile(path.join(__dirname, "../client/dist/index.html"))
// );

// 5) Create the HTTP server & bind Socket.IO
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 6) Your Socket.IO handlers
io.on("connection", (socket) => {
  console.log("↔️  Client connected:", socket.id);

  socket.on("join_lobby", (playerName) => {
    // e.g. emit current rooms back
    socket.emit("rooms_update", { /* ... */ });
  });

  socket.on("create_room", () => {
    // create room, then:
    // io.emit("rooms_update", updatedRooms);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    const roomDetails = { /* … */ };
    socket.emit("joined_room", roomDetails);
    io.to(roomId).emit("room_update", roomDetails);
  });

  socket.on("start_game", () => {
    io.emit("start_game", { room: {/*…*/} });
  });

  socket.on("disconnect", () =>
    console.log("❌  Client disconnected:", socket.id)
  );
});

// 7) Start listening
httpServer.listen(PORT, () => {
  console.log(`🚀  Server listening on port ${PORT}`);
});
