// For local dev: set to your PC's local IP (run `ipconfig` to find it)
// For production: use the deployed server URL
const LOCAL_IP = "10.0.0.204";
const USE_LOCAL = true; // set to false to use production

export const SERVER_URL = USE_LOCAL
  ? `http://${LOCAL_IP}:3001`
  : "https://callbreak-hxwr.onrender.com";
