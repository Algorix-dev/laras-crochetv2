/*
  TIP: This page didn't exist yet — it's what Paystack's callback_url
  (see server/routes/payments.js) points to: CLIENT_URL + '/order-confirmation'.
  Paystack appends ?reference=xxx to that URL when it redirects the
  customer back after payment.

  This page's only job is to read that reference, ask the BACKEND to
  verify it actually cleared with Paystack (never trust the redirect
  alone — a person could land on this URL by typing it manually), and
  show success or failure accordingly. On success, the bag is cleared
  since the order has been placed.
*/
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyPayment } from '../api';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import Footer from '../components/Footer';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const { clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'failed'
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }
    verifyPayment(reference)
      .then((data) => {
        if (data.verified) {
          setOrder(data.order);
          setStatus('success');
          clearCart();
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <>
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center md:px-8">
        {status === 'checking' && (
          <p className="text-sm text-[var(--muted)]">Confirming your payment...</p>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="mb-4 text-[var(--maroon)]" strokeWidth={1.5} />
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)]">
              Order Confirmed
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Thank you! Your order has been placed{order ? ` — reference #${order.paystackReference}` : ''}.
              We'll email you as soon as it ships.
            </p>
            {order && (
              <p className="mt-4 text-sm font-bold">{formatPrice(order.totalAmount)}</p>
            )}
            <Link
              to="/account/orders"
              className="mt-8 rounded-md bg-[var(--maroon)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)]"
            >
              View Order History
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={48} className="mb-4 text-red-500" strokeWidth={1.5} />
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)]">
              Payment Not Confirmed
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              We couldn't confirm this payment. If you were charged, please contact us with your reference
              and we'll sort it out — nothing has been removed from your bag.
            </p>
            <Link
              to="/checkout"
              className="mt-8 rounded-md bg-[var(--ink)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white"
            >
              Back to Checkout
            </Link>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
