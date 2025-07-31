import { io, Socket } from "socket.io-client";

// Point this at wherever your server is deployed:
const SERVER_URL = "https://callbreak-server.onrender.com";

const socket: Socket = io(SERVER_URL, {
  withCredentials: true,
  // allow polling first, then websocket upgrade
  transports: ["polling", "websocket"],
});

export default socket;
