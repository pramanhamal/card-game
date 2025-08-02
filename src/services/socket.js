// @ts-check
import { io } from "socket.io-client";

/**
 * @typedef {import("socket.io-client").Socket} Socket
 */

/** @type {Socket} */
const socket = io(
  import.meta.env.VITE_SOCKET_SERVER_URL || "https://callbreak-server.onrender.com",
  {
    transports: ["polling", "websocket"],
    path: "/socket.io",
    withCredentials: true,
  }
);

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
 * @param {string} name
 */
function setPlayerName(name) {
  if (typeof name === "string" && name.trim()) {
    socket.emit("set_player_name", name.trim());
  }
}

export default socket;
export { setPlayerName };
