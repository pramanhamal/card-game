// src/services/socket.js
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "https://callbreak-server.onrender.com";

const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"],
  path: "/socket.io",
  // withCredentials: true, // only if your server allows credentialed CORS
});

export default socket;
