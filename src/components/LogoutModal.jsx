import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';

/*
  TIP: A "controlled" modal — it doesn't manage its own open/closed
  state, the parent does (via the `open` prop) and tells it what to
  do via onConfirm/onCancel. This is a common pattern for anything
  that needs a "yes I'm sure" confirmation: the component itself
  stays dumb and reusable, the decision logic stays with whoever
  uses it.
*/
/*
  TIP — WHY THIS IS RENDERED THROUGH A PORTAL (the "little box" bug):
  `position: fixed` normally means "relative to the screen". But if ANY
  parent has a CSS `transform` (even an invisible one), the browser
  treats that parent as the reference instead. The account pages are
  wrapped by the scroll-rise animation, which puts a transform on the
  sidebar column — so the modal used to be fixed to THAT small column:
  the dark overlay only covered the sidebar, the card was squeezed to
  ~190px, and it visibly drifted upward while the rise animation
  finished before settling into its "normal look".

  createPortal(..., document.body) moves the modal's DOM node out to
  the end of <body>, above every transformed parent, so `fixed inset-0`
  really is the whole screen from the very first frame. React still
  treats it as a child of AccountSidebar, so state/props work as before.

  SIZE: the card is exactly 322px wide from the md breakpoint (768px)
  up, and full width of the screen (minus the px-5 side gutter on the
  overlay) on phones. For truly edge-to-edge on phones, change the
  overlay's `px-5` to `max-md:px-0`.
*/
export default function LogoutModal({ open, onCancel, onConfirm }) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
      onClick={onCancel} // clicking the dark backdrop cancels, matching typical modal behavior
    >
      <div
        onClick={(e) => e.stopPropagation()} // stop clicks INSIDE the card from bubbling up and closing it
        className="w-full bg-white p-6 text-center shadow-xl md:w-[322px]"
      >
        <div className="mb-3 flex items-start justify-between">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-2)] text-[var(--ink)]"
          >
            <LogOut size={16} />
          </span>
          <button aria-label="Close" onClick={onCancel} className="text-[var(--muted)] hover:text-[var(--ink)]">
            <X size={16} />
          </button>
        </div>
        <h2 className="mb-1 text-left text-sm font-bold">Logout</h2>
        <p className="mb-5 text-left text-xs text-[var(--muted)]">Are you sure you want to logout?</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-[var(--line-2)] py-2.5 text-xs uppercase tracking-wide hover:bg-black/[0.02]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[var(--maroon)] py-2.5 text-xs uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
