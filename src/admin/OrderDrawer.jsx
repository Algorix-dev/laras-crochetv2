/*
  A slide-in panel with everything about one order, plus the status
  control Lara uses to move an order along (Received -> In production ->
  Packaging -> Shipped -> Delivered). The Figma has no order-details
  frame, so this borrows the look of the customer-details card.
*/
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAdmin } from "./AdminData";
import { dateTimeShort, naira } from "./fmt";
import { ORDER_STATUS_KEYS, STATUS_LABEL, STATUS_TONE, methodLabel } from "./model";
import { StatusDot, useToast } from "./ui";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[14px]">
      <span className="shrink-0 text-[var(--a-muted)]">{label}</span>
      <span className="min-w-0 break-words text-right text-[var(--a-ink)]">{children}</span>
    </div>
  );
}

export default function OrderDrawer({ order, onClose }) {
  const { setStatus, demo } = useAdmin();
  const [toast, toastNode] = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;
  const items = order.items || [];
  const paid = order.status !== "pending" && order.status !== "cancelled";

  async function change(e) {
    const next = e.target.value;
    setSaving(true);
    try {
      await setStatus(order._id, next);
      toast(demo ? "Sample data — not saved." : `Marked as ${STATUS_LABEL[next]}.`);
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <aside
        role="dialog"
        aria-label="Order details"
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--a-line)] px-6 py-5">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--a-ink)]">
              {order.orderNumber ? `#${order.orderNumber}` : "Order"}
            </h2>
            <p className="text-[14px] text-[var(--a-muted)]">{dateTimeShort(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--a-muted)] hover:text-[var(--a-ink)]">
            <X size={22} />
          </button>
        </header>

        <div className="a-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <label htmlFor="order-status" className="text-[14px] font-bold text-[var(--a-ink)]">
              Status
            </label>
            <select
              id="order-status"
              value={order.status}
              onChange={change}
              disabled={saving}
              className="mt-2 h-11 w-full rounded-md border border-[var(--a-line-strong)] bg-[var(--a-bg)] px-3 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]"
            >
              {ORDER_STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABEL[key]}
                </option>
              ))}
            </select>
            <p className="mt-2 flex items-center gap-3 text-[14px]">
              <StatusDot tone={paid ? "green" : "red"} plain>
                {paid ? "Paid" : "Unpaid"}
              </StatusDot>
              <StatusDot tone={STATUS_TONE[order.status] === "ink" ? "green" : STATUS_TONE[order.status]}>
                {STATUS_LABEL[order.status]}
              </StatusDot>
            </p>
          </section>

          <section>
            <h3 className="mb-1 text-[16px] font-bold text-[var(--a-ink)]">Customer</h3>
            <Row label="Name">{order.customerName}</Row>
            <Row label="Email">{order.customerEmail}</Row>
            <Row label="Phone">{order.customerPhone}</Row>
            <Row label="Delivery address">{order.shippingAddress}</Row>
          </section>

          <section>
            <h3 className="mb-1 text-[16px] font-bold text-[var(--a-ink)]">Items</h3>
            <ul className="divide-y divide-[var(--a-line)]">
              {items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-2.5 text-[14px]">
                  <div>
                    <p className="font-bold text-[var(--a-ink)]">
                      {item.name} <span className="font-normal text-[var(--a-muted)]">× {item.quantity || 1}</span>
                    </p>
                    <p className="text-[13px] text-[var(--a-muted)]">
                      {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-[var(--a-ink)]">{naira((item.price || 0) * (item.quantity || 1))}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--a-line-strong)] pt-3 text-[16px] font-bold text-[var(--a-ink)]">
              <span>Total</span>
              <span>{naira(order.totalAmount)}</span>
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-[16px] font-bold text-[var(--a-ink)]">Payment</h3>
            <Row label="Method">{methodLabel(order)}</Row>
            {order.paymentMethod?.last4 && <Row label="Card">•••• {order.paymentMethod.last4}</Row>}
            <Row label="Paystack reference">{order.paystackReference}</Row>
            {order.carrier && <Row label="Carrier">{order.carrier}</Row>}
            {order.trackingNumber && <Row label="Tracking number">{order.trackingNumber}</Row>}
          </section>
        </div>
      </aside>
      {toastNode}
    </div>
  );
}
