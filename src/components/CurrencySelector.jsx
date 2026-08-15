import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { currencies, useCurrency } from '../context/CurrencyContext';

/**
 * Flag — Renders an inline SVG flag for a given currency code.
 *
 * Supported flags:
 *   NGN — Nigerian flag (green-white-green vertical stripes)
 *   USD — US flag (stars and stripes)
 *   GBP — Union Jack (default fallback)
 *
 * @param {{ code: string }} props
 */
function Flag({ code }) {
  if (code === 'NGN') {
    // TIP: Nigerian flag — green-white-green vertical stripes
    return (
      <svg viewBox="0 0 30 20" className="h-3.5 w-5" aria-hidden="true">
        <path fill="#008751" d="M0 0h10v20H0zm20 0h10v20H20z" />
        <path fill="#fff" d="M10 0h10v20H10z" />
      </svg>
    );
  }

  if (code === 'USD') {
    // TIP: US flag — red background with white stripes and blue canton
    return (
      <svg viewBox="0 0 30 20" className="h-3.5 w-5" aria-hidden="true">
        <path fill="#b22234" d="M0 0h30v20H0z" />
        <path
          stroke="#fff"
          strokeWidth="1.54"
          d="M0 2.3h30M0 5.4h30M0 8.5h30M0 11.5h30M0 14.6h30M0 17.7h30"
        />
        <path fill="#3c3b6e" d="M0 0h13v10H0z" />
      </svg>
    );
  }

  // TIP: Union Jack (GBP) — blue field with white and red crosses
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5" aria-hidden="true">
      <path fill="#012169" d="M0 0h30v20H0z" />
      <path
        stroke="#fff"
        strokeWidth="4"
        d="M0 0l30 20M30 0L0 20"
      />
      <path
        stroke="#c8102e"
        strokeWidth="1.5"
        d="M0 0l30 20M30 0L0 20"
      />
      <path
        stroke="#fff"
        strokeWidth="6"
        d="M15 0v20M0 10h30"
      />
      <path
        stroke="#c8102e"
        strokeWidth="3"
        d="M15 0v20M0 10h30"
      />
    </svg>
  );
}

/**
 * CurrencySelector — Dropdown that shows the current currency with its flag
 * and lets the user switch between available currencies.
 */
export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* TIP: Toggle button — displays the current currency code with its flag and a chevron */}
      <button
        aria-label="Select currency"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--line)] py-1 pl-1 pr-2 text-xs font-medium"
      >
        <Flag code={currency} />
        {currency}
        <ChevronDown size={14} />
      </button>

      {/* TIP: Dropdown panel — lists all available currencies; clicking one sets it and closes the panel */}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-28 border border-[var(--line)] bg-white p-1 shadow-lg">
          {Object.keys(currencies).map((code) => (
            <button
              key={code}
              onClick={() => {
                setCurrency(code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-[var(--cream)]"
            >
              <Flag code={code} />
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}