import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { countries } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

// TIP: the design shows countries labeled like "Nigeria (NGN)" — a
// currency-style code, not the plain ISO country code our data uses
// (NG, GB, US...). Since only 3 real currencies exist in
// CurrencyContext (NGN/USD/GBP), everything else falls back to USD
// for pricing purposes, matching how most Nigerian storefronts price
// international orders. The label shown is still each country's own
// code, not a fabricated currency table for 17 countries we don't
// actually support pricing in.
const countryToCurrency = { NG: "NGN", GB: "GBP", US: "USD" };

/**
 * CountrySelectorModal — full-screen searchable country picker,
 * replacing the old compact 3-item currency dropdown. Selecting a
 * country updates the site currency (mapped where we have real
 * exchange rates, USD otherwise) and closes the modal.
 */
export default function CountrySelectorModal() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // TIP: figure out which country is "selected" from the current
  // currency by reverse-looking-up countryToCurrency — falls back to
  // Nigeria (index 0) if the currency doesn't map to a specific country.
  const selected =
    countries.find((c) => countryToCurrency[c.code] === currency) || countries[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(country) {
    setCurrency(countryToCurrency[country.code] || "USD");
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        aria-label="Select your country"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold"
      >
        <span aria-hidden="true">{selected.flag}</span>
        {currency}
        <ChevronDown size={18} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--maroon-dark)]/70 px-5"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--ink)]">Select Your Country</h2>
              <button aria-label="Close" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={18} />
              </button>
            </div>

            {/* Closed-state pill, showing the current selection, static here as a visual anchor */}
            <div className="mb-3 flex items-center gap-2 border border-[var(--line-2)] px-3 py-2.5 text-sm">
              <span aria-hidden="true">{selected.flag}</span>
              <span className="flex-1">{selected.name} ({selected.code})</span>
              <ChevronDown size={16} className="text-[var(--muted)]" />
            </div>

            <label className="relative mb-3 block">
              <span className="sr-only">Search for a country</span>
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a country..."
                className="w-full border border-[var(--line)] py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[var(--ink)]"
              />
              <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </label>

            <div className="max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c)}
                  className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:bg-[var(--cream)]"
                >
                  <span>
                    {c.name} <span className="text-[var(--muted)]">({c.code})</span>
                  </span>
                  {c.code === selected.code && <Check size={15} />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--muted)]">No countries match "{query}".</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Check(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
