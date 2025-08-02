// src/services/socket.js
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "https://callbreak-server.onrender.com";

const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"],
  path: "/socket.io",
  withCredentials: true, // keep this if server uses credentialed CORS (production); remove temporarily if using DEBUG_CORS
});

// Logging for visibility
socket.on("connect", () => {
  console.log("✅ Connected to server, socket id:", socket.id);
});
socket.on("connect_error", (err) => {
  console.warn("⚠️ Socket connection error:", err);
});
socket.on("disconnect", (reason) => {
  console.log("🔌 Disconnected:", reason);
});

/**
 * Tell the server what display name to use. Should be called before create/join room.
 * @param {string} name
 */
function setPlayerName(name) {
  if (typeof name === "string" && name.trim()) {
    socket.emit("set_player_name", name.trim());
  }
}

export default socket;
export { setPlayerName };
