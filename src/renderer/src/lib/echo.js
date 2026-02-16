import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const host = import.meta.env.VITE_REVERB_HOST;
const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";

export const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: host,
  wsPort: port,
  wssPort: port,
  forceTLS: scheme === "https",
  enabledTransports: ["ws", "wss"],
});
