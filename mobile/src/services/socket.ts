import { io } from "socket.io-client";
import { SERVER_URL } from "../config";

const socket = io(SERVER_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;
