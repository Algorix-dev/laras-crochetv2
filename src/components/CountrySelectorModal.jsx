import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, defaultCountry } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

/**
 * CountrySelectorModal — full-screen searchable country picker.
 * Selecting a country updates the site currency (NGN for Nigeria, GBP
 * for the UK, USD for everywhere else, since those are the only 3
 * currencies with real exchange rates — see CurrencyContext) and
 * closes the modal. The selected country itself (not just its
 * currency) is remembered, so the pill always shows the country you
 * actually picked instead of falling back to whichever country
 * happens to share that currency.
 */
export default function CountrySelectorModal() {
  const { country, setCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = countries.find((c) => c.code === country) || defaultCountry;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(country) {
    setCountry(country.code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        aria-label="Select your country"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 max-w-[160px] items-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold"
      >
        <span aria-hidden="true" className="shrink-0">{selected.flag}</span>
        <span className="truncate">{selected.name}</span>
        <ChevronDown size={18} className="shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
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
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{c.flag}</span>
                    {c.name} <span className="text-[var(--muted)]">({c.code})</span>
                  </span>
                  {c.code === selected.code && <Check size={14} strokeWidth={2} />}
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
