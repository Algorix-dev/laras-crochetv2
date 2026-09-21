/*
  VISITOR TRACKING (the storefront's half)

  Sends a tiny "I'm here" ping to POST /api/analytics/ping so the admin
  dashboard can show "users in the last 30 minutes", visitors per day and
  the conversion rate. See server/models/Visit.js for what is stored.

  Privacy: the only thing sent is a random id this browser made up for
  itself, plus the page path. No cookies, no name/email/IP is stored.
  Browsers that ask not to be tracked ("Do Not Track") are skipped, and so
  are the /admin pages and local development.
*/
const API_URL = import.meta.env.VITE_API_URL;
const KEY = "laras-visitor";

function getVisitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const random =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      id = random.replace(/-/g, "");
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked (private mode etc.) — just don't track
  }
}

export function sendVisitorPing(path) {
  if (import.meta.env.DEV) return; // don't count our own local testing
  if (!API_URL || path.startsWith("/admin")) return;
  if (typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || window.doNotTrack === "1")) return;

  const visitorId = getVisitorId();
  if (!visitorId) return;

  // keepalive lets the ping finish even if the page is closing;
  // a failed ping must never bother the shopper, so errors are ignored
  fetch(`${API_URL}/api/analytics/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, path }),
    keepalive: true,
  }).catch(() => {});
}
