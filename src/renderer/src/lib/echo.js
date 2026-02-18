import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const host = import.meta.env.VITE_REVERB_HOST;
const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
const appKey = import.meta.env.VITE_REVERB_APP_KEY;

export const echo =
  host && appKey
    ? new Echo({
        broadcaster: "reverb",
        key: appKey,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === "https",
        enabledTransports: ["ws", "wss"],
      })
    : null;
