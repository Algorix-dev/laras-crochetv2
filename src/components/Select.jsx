import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/*
  Select — a styled dropdown that replaces the browser's plain <select>.

  TIP — HOW TO USE: it is a drop-in swap. Write it exactly like a normal select:

    <Select value={x} onChange={(e) => setX(e.target.value)} className="h-11 w-full rounded-md border px-3">
      <option value="a">Option A</option>
      <option value="b">Option B</option>
    </Select>

  `className` styles the CLOSED box (height, border, padding, text size) — the arrow is added for you.
  The OPEN list is drawn by this file, so to change how every dropdown looks (colours, row height,
  rounded corners), change the classes marked "TIP: list look" below. One edit restyles the whole
  site and the admin.

  How it stays fast: nothing is drawn until you open it, and the list is drawn once, on top of the page
  (a "portal"), so it can never be cut off by a card or table that scrolls.
*/

const textOf = (node) =>
  Children.toArray(node)
    .map((n) => (typeof n === "string" || typeof n === "number" ? String(n) : isValidElement(n) ? textOf(n.props.children) : ""))
    .join("");

export default function Select({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  name,
  id,
  title,
  "aria-label": ariaLabel,
}) {
  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter((c) => isValidElement(c) && c.type === "option")
        .map((c) => ({
          value: String(c.props.value ?? textOf(c.props.children)),
          label: textOf(c.props.children),
          disabled: !!c.props.disabled,
        })),
    [children]
  );

  const current = options.find((o) => o.value === String(value ?? ""));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState(null); // where to draw the list
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: "", at: 0 });
  const uid = useId();

  // open: measure the closed box and decide whether the list goes below or above it
  const openList = () => {
    if (disabled) return;
    const r = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const wanted = Math.min(280, options.length * 40 + 8);
    const flip = below < wanted && above > below;
    setBox({
      left: r.left,
      width: Math.max(r.width, 140),
      top: flip ? undefined : r.bottom + 4,
      bottom: flip ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(120, Math.min(280, (flip ? above : below) - 12)),
    });
    setActive(Math.max(0, options.findIndex((o) => o.value === String(value ?? ""))));
    setOpen(true);
  };

  const choose = (opt) => {
    if (!opt || opt.disabled) return;
    setOpen(false);
    triggerRef.current?.focus();
    if (opt.value !== String(value ?? "")) onChange?.({ target: { value: opt.value, name }, currentTarget: { value: opt.value, name } });
  };

  // close on outside click, Escape, page scroll or resize
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    const onScroll = (e) => {
      if (!listRef.current?.contains(e.target)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", outside);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // keep the highlighted row in view while using the arrow keys
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const step = (dir) => {
    if (!options.length) return;
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(options[active]); }
    else if (e.key === "Tab") setOpen(false);
    else if (e.key.length === 1) {
      // type a few letters to jump to a matching row
      const now = Date.now();
      typed.current.text = now - typed.current.at > 700 ? e.key.toLowerCase() : typed.current.text + e.key.toLowerCase();
      typed.current.at = now;
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">{current ? current.label : ""}</span>
        <ChevronDown size={16} className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      {open &&
        box &&
        createPortal(
          /* TIP: list look — the white panel. Change rounded-lg / shadow / border here. */
          <ul
            ref={listRef}
            id={`${uid}-list`}
            role="listbox"
            aria-activedescendant={`${uid}-o${active}`}
            style={{ position: "fixed", left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.maxHeight }}
            className="z-[400] overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.16)]"
          >
            {options.map((o, i) => {
              const selected = o.value === String(value ?? "");
              return (
                /* TIP: list look — each row. Row height is py-2; highlight colour is bg-black/[0.05]. */
                <li
                  key={o.value + i}
                  id={`${uid}-o${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={o.disabled || undefined}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[15px] leading-5 text-[#1f2328] ${
                    i === active ? "bg-black/[0.05]" : ""
                  } ${selected ? "font-bold" : ""} ${o.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {selected && <Check size={16} className="shrink-0 text-[var(--a-maroon,var(--maroon,#5a1a2a))]" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}
