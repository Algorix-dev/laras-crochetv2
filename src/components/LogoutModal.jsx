import { LogOut, X } from 'lucide-react';

/*
  TIP: A "controlled" modal — it doesn't manage its own open/closed
  state, the parent does (via the `open` prop) and tells it what to
  do via onConfirm/onCancel. This is a common pattern for anything
  that needs a "yes I'm sure" confirmation: the component itself
  stays dumb and reusable, the decision logic stays with whoever
  uses it.
*/
export default function LogoutModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--maroon-dark)]/70 px-5"
      onClick={onCancel} // clicking the dark backdrop cancels, matching typical modal behavior
    >
      <div
        onClick={(e) => e.stopPropagation()} // stop clicks INSIDE the card from bubbling up and closing it
        className="w-full max-w-xs bg-white p-6 text-center shadow-xl"
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
    </div>
  );
}
