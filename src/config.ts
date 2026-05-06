// Detect if running locally or in production
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// In dev, use an empty string so socket.io connects to the same origin.
// Vite proxies /socket.io → http://localhost:3001 (the game server).
// In production, connect directly to the deployed backend.
export const SERVER_URL = isProduction
  ? "https://call-break-server.onrender.com"
  : "";
