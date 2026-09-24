/*
  TIP — PAYSTACK POPUP (the "Payment" block on Checkout):
  Paystack's own script (inline.js) opens their secure payment window
  ON TOP of our page: the customer types their card (or picks bank
  transfer / USSD) inside Paystack's window, so card details never touch
  our page or our server. That's why the Payment block on the checkout
  page has no card <input>s of its own — DIY card fields would put the
  site in PCI-compliance scope.

  The script is loaded only when someone actually presses Pay, and only
  once. If it can't load (ad-blocker, offline, blocked network) the
  callers fall back to the old full-page redirect, so payment never
  becomes impossible.
*/
const SCRIPT_SRC = 'https://js.paystack.co/v2/inline.js';

let loading = null;

export function loadPaystack() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack did not start'));
    script.onerror = () => reject(new Error('Paystack could not be loaded'));
    document.head.appendChild(script);
  }).catch((err) => {
    loading = null; // let a later click try again
    throw err;
  });

  return loading;
}

// Opens the popup for a transaction the BACKEND already created
// (accessCode comes from POST /api/payments/initialize).
export async function openPaystackPopup(accessCode, { onSuccess, onCancel, onError }) {
  const PaystackPop = await loadPaystack();
  const popup = new PaystackPop();
  popup.resumeTransaction(accessCode, { onSuccess, onCancel, onError });
}
