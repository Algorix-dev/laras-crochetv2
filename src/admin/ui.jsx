/*
  Shared building blocks for every admin screen. They are small on purpose:
  the screens (src/admin/pages/*) read almost like the Figma frames.
*/
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ellipsis,
  EllipsisVertical,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cx } from "./fmt";

/* ---------------- surfaces ---------------- */

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        "rounded-lg bg-white shadow-[0_1px_3px_rgba(16,24,40,0.14),0_2px_10px_rgba(16,24,40,0.04)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Kebab({ className }) {
  return (
    <button
      type="button"
      aria-label="More options"
      className={cx("flex size-6 items-center justify-center text-[#4b5563] hover:text-[var(--a-maroon)]", className)}
    >
      <EllipsisVertical size={18} strokeWidth={2.4} />
    </button>
  );
}

export function CardHead({ title, children, className }) {
  return (
    <div className={cx("flex items-center justify-between gap-3", className)}>
      <h3 className="text-[18px] font-bold leading-6 text-[var(--a-ink)]">{title}</h3>
      {children}
    </div>
  );
}

/* ---------------- deltas + status ---------------- */

export function Delta({ value, suffix = "%", className }) {
  if (value == null || Number.isNaN(value)) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-[14px] font-normal",
        up ? "text-[var(--a-green)]" : "text-[var(--a-red)]",
        className
      )}
    >
      <Icon size={14} strokeWidth={2} />
      {Math.abs(Math.round(value * 10) / 10)}
      {suffix}
    </span>
  );
}

const DOT = {
  green: "bg-[var(--a-green)]",
  red: "bg-[var(--a-red)]",
  amber: "bg-[var(--a-amber)]",
  yellow: "bg-[var(--a-yellow)]",
};
const TEXT = {
  green: "text-[var(--a-green)]",
  red: "text-[var(--a-red)]",
  amber: "text-[var(--a-amber)]",
  yellow: "text-[var(--a-amber)]",
  ink: "text-[var(--a-ink)]",
};

// ● Paid   ● Unpaid   ● Active ...  (the dot and the word share a colour)
export function StatusDot({ tone = "green", children, plain = false }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-[15px]", plain ? "text-[var(--a-ink)]" : TEXT[tone])}>
      <i className={cx("size-2 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}

/* ---------------- buttons ---------------- */

const BTN = {
  primary:
    "bg-[var(--a-maroon)] text-white hover:bg-[var(--a-maroon-dark)] disabled:opacity-60",
  white:
    "bg-white text-[var(--a-ink)] shadow-[0_1px_3px_rgba(16,24,40,0.16)] hover:bg-[#f9fafb]",
  outline:
    "border border-[var(--a-text)] bg-white text-[var(--a-text)] hover:bg-[#f9fafb]",
  outlineBlue:
    "border border-[var(--a-blue)] bg-white text-[var(--a-blue)] hover:bg-[#f5f5ff]",
  danger: "bg-[#ffe4e6] text-[var(--a-red)] hover:bg-[#ffd5d9]",
};

export function Btn({ variant = "primary", className, children, as: Tag = "button", ...rest }) {
  return (
    <Tag
      {...(Tag === "button" ? { type: "button" } : {})}
      className={cx(
        "inline-flex items-center justify-center gap-2 text-[16px] font-bold disabled:cursor-not-allowed",
        BTN[variant],
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// the small pill under a stat card: "Details" (pass `to` to make it a link)
export function PillButton({ children, tone = "dark", to, className, ...rest }) {
  const classes = cx(
    "inline-flex h-8 items-center justify-center rounded-full border bg-white px-6 text-[16px] font-normal",
    tone === "blue"
      ? "border-[var(--a-blue)] text-[var(--a-blue)] hover:bg-[#f5f5ff]"
      : "border-[var(--a-text)] text-[var(--a-text)] hover:bg-[#f9fafb]",
    className
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

export function IconBtn({ children, label, className, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(
        "flex size-10 shrink-0 items-center justify-center rounded-md border border-[#d7dadf] bg-white text-[var(--a-text)] shadow-[0_1px_2px_rgba(16,24,40,0.08)] hover:bg-[#f9fafb]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function MoreIconBtn(props) {
  return (
    <IconBtn label="More" {...props}>
      <Ellipsis size={18} />
    </IconBtn>
  );
}

/* ---------------- tabs / segmented ---------------- */

// pink rounded strip with a white "selected" pill: All order (240) | Completed | ...
export function PillTabs({ tabs, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cx("inline-flex items-center gap-1 rounded-md bg-[var(--a-pink)] p-1", className)}
    >
      {tabs.map((tab) => {
        const on = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(tab.value)}
            className={cx(
              "h-8 whitespace-nowrap rounded px-4 text-[15px]",
              on
                ? "bg-white font-bold text-[var(--a-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.12)]"
                : "text-[var(--a-ink)]/80 hover:text-[var(--a-ink)]"
            )}
          >
            {tab.label}
            {tab.count != null && <span className="ml-1">({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

// the small "This week | Last week" switch on chart cards
export function WeekSwitch({ value, onChange }) {
  const options = [
    { value: "this", label: "This week" },
    { value: "last", label: "Last week" },
  ];
  return (
    <div className="inline-flex items-center rounded-lg bg-[var(--a-pink)] p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "h-8 rounded-md px-3.5 text-[13px]",
              on ? "bg-white font-bold text-[var(--a-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[var(--a-muted)]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- inputs ---------------- */

export function SearchField({ value, onChange, placeholder = "Search", className, round = false }) {
  return (
    <label
      className={cx(
        "flex h-10 items-center gap-2 bg-[var(--a-bg)] px-3",
        round ? "rounded-full" : "rounded-md",
        className
      )}
    >
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--a-text)] outline-none"
      />
      <Search size={18} className="shrink-0 text-[var(--a-text)]" />
    </label>
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="size-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-[#cfe9d6] bg-white checked:border-[var(--a-maroon)] checked:bg-[var(--a-maroon)] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.4%22><path d=%22M3.5 8.5l3 3 6-6.5%22/></svg>')]"
    />
  );
}

/* ---------------- tables ---------------- */

// the pink header row used by every table in the design
export function HeadRow({ className, children }) {
  return (
    <div
      className={cx(
        "grid items-center rounded-md bg-[var(--a-pink)] px-4 text-[15px] text-[var(--a-ink)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- pagination ---------------- */

function pageWindow(page, pages) {
  if (pages <= 6) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", pages];
  if (page >= pages - 3) return [1, "gap", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "gap", page - 1, page, page + 1, "gap", pages];
}

export function Pager({ page, pages, onPage }) {
  const items = pageWindow(page, pages);
  return (
    <div className="flex items-center justify-between gap-3 pt-6">
      <Btn
        variant="white"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="h-10 rounded-md px-4 text-[15px] font-normal disabled:opacity-50"
      >
        <ArrowLeft size={16} /> Previous
      </Btn>

      <div className="hidden items-center gap-3 sm:flex">
        {items.map((item, i) =>
          item === "gap" ? (
            <span
              key={`gap-${i}`}
              className="flex h-9 min-w-9 items-center justify-center rounded border border-[#d7dadf] bg-white px-1 text-[13px] text-[var(--a-ink)]"
            >
              .....
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? "page" : undefined}
              className={cx(
                "flex size-9 items-center justify-center rounded text-[15px] text-[var(--a-ink)]",
                item === page ? "bg-[var(--a-pink)]" : "border border-[#d7dadf] bg-white hover:bg-[#f9fafb]"
              )}
            >
              {item}
            </button>
          )
        )}
      </div>
      <span className="text-sm text-[var(--a-muted)] sm:hidden">
        {page} / {pages}
      </span>

      <Btn
        variant="white"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="h-10 rounded-md px-4 text-[15px] font-normal disabled:opacity-50"
      >
        Next <ArrowRight size={16} />
      </Btn>
    </div>
  );
}

/* ---------------- misc ---------------- */

export function Thumb({ src, alt = "", size = 32, className }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded bg-[#f3f4f5]",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt={alt} className="size-full object-cover" loading="lazy" /> : null}
    </span>
  );
}

export function EmptyState({ title, text, className }) {
  return (
    <div className={cx("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <p className="text-[16px] font-bold text-[var(--a-ink)]">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[14px] text-[var(--a-muted)]">{text}</p>}
    </div>
  );
}

// closes a popover when you click outside it or press Escape
export function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

// tiny toast used for "saved" / "couldn't" messages
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  function show(message, tone = "ok") {
    window.clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = toast ? (
    <div
      role="status"
      className={cx(
        "fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-md px-4 py-3 text-[14px] font-bold shadow-lg",
        toast.tone === "error" ? "bg-[var(--a-red)] text-white" : "bg-[var(--a-maroon)] text-white"
      )}
    >
      {toast.message}
    </div>
  ) : null;
  return [show, node];
}

// a small dropdown: <DropMenu trigger={<IconBtn/>} items={[{label, onClick}]} />
export function DropMenu({ trigger, items, align = "right", className }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className={cx("relative", className)}>
      <span onClick={() => setOpen((o) => !o)} role="presentation">
        {trigger}
      </span>
      {open && (
        <ul
          role="menu"
          className={cx(
            "absolute top-full z-30 mt-1 min-w-[180px] rounded-md bg-white py-1 shadow-[0_4px_18px_rgba(16,24,40,0.18)]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cx(
                  "flex w-full items-center gap-2 px-4 py-2 text-left text-[14px] hover:bg-[#f3f4f5]",
                  item.active ? "font-bold text-[var(--a-ink)]" : "text-[var(--a-text)]"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { TEXT as toneText };
