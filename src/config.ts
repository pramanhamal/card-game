// Detect if running locally or in production
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const SERVER_URL = isProduction
  ? "https://call-break-server.onrender.com"
  : "http://localhost:3000";
