/*
  TOASTER — draws the notifications from utils/toast.js.
  Mounted ONCE in App.jsx (inside the router, so the "View bag" style buttons can navigate).

  - Phones: slides down from the top, full width, under the navbar.
  - Desktop: stacks in the top-right corner, under the navbar.
  - Disappears by itself after ~3.5s (errors and order updates stay a bit longer),
    pauses while you hover it, and has a close button.
  - Shows at most 3 at once; an identical message fired twice in a blink shows only once.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Package, X } from 'lucide-react';
import { TOAST_EVENT } from '../utils/toast';

const MAX_VISIBLE = 3;
const DEFAULT_MS = 3500;

const ICONS = {
  success: <CheckCircle2 size={20} strokeWidth={1.75} className="text-[var(--maroon)]" />,
  error: <AlertCircle size={20} strokeWidth={1.75} className="text-red-600" />,
  info: <Info size={20} strokeWidth={1.75} className="text-[var(--mauve-muted)]" />,
  order: <Package size={20} strokeWidth={1.75} className="text-[var(--maroon)]" />,
};

function ToastItem({ item, onClose, onAction }) {
  const timer = useRef(null);
  const left = useRef(item.duration);
  const startedAt = useRef(0);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    clearTimeout(timer.current);
    timer.current = setTimeout(onClose, left.current);
  }, [onClose]);

  const pause = () => {
    clearTimeout(timer.current);
    left.current = Math.max(1200, left.current - (Date.now() - startedAt.current));
  };

  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
  }, [start]);

  return (
    <motion.div
      layout
      role={item.type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onMouseEnter={pause}
      onMouseLeave={start}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--white-warm)] px-4 py-3 text-left shadow-[0_8px_24px_rgba(65,43,45,0.14)] md:w-[360px]"
    >
      <span className="mt-0.5 shrink-0">{ICONS[item.type] || ICONS.info}</span>
      <div className="min-w-0 flex-1">
        {item.title && <p className="text-sm font-bold text-[var(--ink)]">{item.title}</p>}
        <p className="text-sm leading-snug text-[var(--ink)]">{item.message}</p>
        {item.action && (
          <button
            type="button"
            onClick={() => onAction(item)}
            className="mt-1.5 text-xs font-bold uppercase tracking-wider text-[var(--maroon)] underline underline-offset-2"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="-mr-1 shrink-0 rounded p-1 text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const seq = useRef(0);
  const recent = useRef(new Map()); // message -> time, to drop accidental double-fires

  useEffect(() => {
    const onToast = (e) => {
      const d = e.detail;
      const base = typeof d === 'string' ? { message: d } : d || {};
      if (!base.message) return;

      const now = Date.now();
      if (now - (recent.current.get(base.message) || 0) < 700) return;
      recent.current.set(base.message, now);

      const next = {
        id: ++seq.current,
        type: base.type || 'info',
        title: base.title,
        message: base.message,
        action: base.action,
        duration: base.duration || DEFAULT_MS,
      };
      setItems((cur) => [...cur, next].slice(-MAX_VISIBLE));
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  const close = useCallback((id) => setItems((cur) => cur.filter((t) => t.id !== id)), []);

  const runAction = (item) => {
    if (item.action?.to) navigate(item.action.to);
    close(item.id);
  };

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[300] flex flex-col items-stretch gap-2 px-3 md:left-auto md:right-6 md:items-end md:px-0"
      style={{ top: 'calc(var(--nav-h, 66px) + 8px)' }}
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastItem key={item.id} item={item} onClose={() => close(item.id)} onAction={runAction} />
        ))}
      </AnimatePresence>
    </div>
  );
}
