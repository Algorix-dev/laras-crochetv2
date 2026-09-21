// Renders nothing. Sends a visitor ping when a page opens / the route
// changes, then once a minute while the tab is visible (so "users in the
// last 30 minutes" is accurate). Mounted once in App.jsx.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { sendVisitorPing } from "../utils/visitorTracking";

const HEARTBEAT_MS = 60 * 1000;

export default function VisitorTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    sendVisitorPing(pathname);

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") sendVisitorPing(pathname);
    }, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") sendVisitorPing(pathname);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
