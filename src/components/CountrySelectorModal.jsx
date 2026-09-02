import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, defaultCountry } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

/*
 * CountrySelectorModal
 *
 * CLOSED:
 *   Shows the selected country's flag + ISO alpha-3 code.
 *   Example: 🇳🇬 NGA
 *
 * OPEN:
 *   Shows the full country name, flag, and currency.
 *   Example: 🇳🇬 Nigeria        NGN ✓
 *
 * SEARCH:
 *   Searches by country name, 2-letter code, 3-letter code,
 *   or currency code.
 *
 * NOTE:
 * This component is the country selector that should be used
 * in Navbar.jsx. CurrencySelector.jsx is a separate currency-only
 * selector and should NOT be rendered alongside this one if you
 * want one combined country/currency control.
 */

export default function CountrySelectorModal() {
  const { country, setCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected =
    countries.find((c) => c.code === country) || defaultCountry;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return countries;

    return countries.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.code3?.toLowerCase().includes(q) ||
        c.currency?.toLowerCase().includes(q)
      );
    });
  }, [query]);

  function handleSelect(country) {
    setCountry(country.code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      {/* Header selector:
          flag + ISO alpha-3 code only */}
      <button
        type="button"
        aria-label={`Select country: ${selected.name}`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 max-w-[160px] items-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold"
      >
        <span aria-hidden="true" className="shrink-0 text-base leading-none">
          {selected.flag}
        </span>

        <span className="truncate">
          {selected.code3 || selected.code.toUpperCase()}
        </span>

        <ChevronDown size={18} className="shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select Your Country"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-white p-6 shadow-xl"
          >
            {/* Modal heading */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--ink)]">
                Select Your Country
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current selection:
                full country name + currency */}
            <div className="mb-3 flex h-12 items-center gap-3 border border-[var(--line-2)] px-3 text-sm">
              <span
                aria-hidden="true"
                className="shrink-0 text-base leading-none"
              >
                {selected.flag}
              </span>

              <span className="flex-1 truncate font-medium">
                {selected.name}
              </span>

              <span className="text-[var(--muted)]">
                {selected.currency || "—"}
              </span>

              <ChevronDown
                size={16}
                className="shrink-0 text-[var(--muted)]"
              />
            </div>

            {/* Search */}
            <label className="relative mb-3 block">
              <span className="sr-only">Search for a country</span>

              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a country..."
                className="h-12 w-full border border-[var(--line)] py-2.5 pl-3 pr-10 text-sm outline-none focus:border-[var(--ink)]"
              />

              <Search
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
            </label>

            {/* Country list */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => handleSelect(c)}
                  className="flex w-full items-center gap-3 px-1 py-2.5 text-left text-sm hover:bg-[var(--cream)]"
                >
                  <span
                    aria-hidden="true"
                    className="w-6 shrink-0 text-base leading-none"
                  >
                    {c.flag}
                  </span>

                  <span className="min-w-0 flex-1 truncate">
                    {c.name}
                  </span>

                  <span className="shrink-0 text-[var(--muted)]">
                    {c.currency || "—"}
                  </span>

                  {c.code === selected.code && (
                    <Check size={15} strokeWidth={2} className="shrink-0" />
                  )}
                </button>
              ))}

              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--muted)]">
                  No countries match "{query}".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
