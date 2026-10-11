/*
  ORDER UPDATE WATCHER — tells a signed-in customer when Lara moves one of their orders along
  ("Your order is on its way", "Your order was delivered").

  How: it asks the server for the customer's orders (the same GET /api/orders/mine the Order
  History page uses) when they open the site, when they come back to the tab, and every few
  minutes while it is open. It remembers the last status it saw per order in this browser; a
  change shows a toast. The very first look only records statuses — it never announces old orders.
  Mounted once in App.jsx; draws nothing itself.
*/
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const POLL_MS = 3 * 60 * 1000;

const MESSAGES = {
  paid: 'We have your order and Lara will start on it soon.',
  in_production: 'Lara has started making your order.',
  packaging: 'Your order is being packaged.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order was delivered. We hope you love it!',
  cancelled: 'Your order was cancelled. Contact us if this is a surprise.',
};

export default function OrderUpdateWatcher() {
  const { isSignedIn, token, user } = useAuth();
  const who = user?.email || user?.id || user?._id || 'me';

  useEffect(() => {
    if (!isSignedIn || !token || !import.meta.env.VITE_API_URL) return undefined;
    const storeKey = `laras-order-status:${who}`;
    let stopped = false;

    async function check() {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || stopped) return;
        const orders = await res.json();
        if (!Array.isArray(orders)) return;

        let seen = null;
        try {
          seen = JSON.parse(localStorage.getItem(storeKey));
        } catch {
          seen = null;
        }
        const next = {};
        for (const o of orders) {
          const id = o._id || o.id;
          next[id] = o.status;
          // seen === null means first look on this browser: record only, announce nothing
          if (seen && seen[id] && seen[id] !== o.status && MESSAGES[o.status]) {
            toast.order(MESSAGES[o.status], {
              title: `Order #${o.orderNumber || o.paystackReference}`,
              action: { label: 'View order', to: `/account/orders/${id}` },
            });
          }
        }
        try {
          localStorage.setItem(storeKey, JSON.stringify(next));
        } catch {
          /* storage full or blocked — fine, we just won't remember */
        }
      } catch {
        /* offline or server waking up — try again next time */
      }
    }

    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isSignedIn, token, who]);

  return null;
}
