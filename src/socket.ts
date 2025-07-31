// client/src/socket.ts
import { io, Socket } from "socket.io-client";

const SERVER_URL = "https://callbreak-server.onrender.com";

const socket: Socket = io(SERVER_URL, {
  withCredentials: true,
  // skip HTTP polling entirely; use pure WebSockets
  transports: ["websocket"],
});

export default socket;
