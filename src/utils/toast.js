/*
  TOASTS — the small pop-up notifications ("Added to bag", "Order is on its way"...).

  HOW IT WORKS: any file can call toast.success("...") and the <Toaster /> mounted once in
  App.jsx shows it. No provider or hook is needed, so this also works inside context files.

    import { toast } from '../utils/toast';
    toast.success('Added to bag');
    toast.error('Could not save — try again');
    toast.info('Link copied');
    toast.order('Order #AG-2026-0001 is on its way', { action: { label: 'Track', to: '/account/orders' } });

  The older code that dispatches a 'lara-toast' event with a plain string still works too.
  Options: { title, action: { label, to }, duration (ms) }
*/
export const TOAST_EVENT = 'lara-toast';

export function notify(message, type = 'info', options = {}) {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { message, type, ...options } })
  );
}

export const toast = {
  success: (message, options) => notify(message, 'success', options),
  error: (message, options) => notify(message, 'error', { duration: 5000, ...options }),
  info: (message, options) => notify(message, 'info', options),
  order: (message, options) => notify(message, 'order', { duration: 6000, ...options }),
};
