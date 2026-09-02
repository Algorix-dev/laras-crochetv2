import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, defaultCountry } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

/*
 * Converts a 2-letter ISO country code into a real flag image.
 *
 * Examples:
 * NG -> Nigeria flag
 * GB -> United Kingdom flag
 * US -> United States flag
 * IE -> Ireland flag
 */
function Flag({ code, className = "h-4 w-6" }) {
  const alpha2 = String(code || "").toLowerCase();

  return (
    <img
      src={`https://flagcdn.com/${alpha2}.svg`}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 object-cover`}
    />
  );
}

/*
 * CountrySelectorModal
 *
 * Closed:
 *   🇳🇬 NGA
 *
 * Open:
 *   🇳🇬 Nigeria          ✓
 *   🇩🇿 Algeria
 *   🇦🇴 Angola
 *
 * The 2-letter ISO code is used internally to load the flag.
 * The 3-letter ISO code is what the customer sees.
 */

export default function CountrySelectorModal() {
  const { country, setCountry } = useCurrency();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  /*
   * Find the currently selected country.
   *
   * Your existing data appears to use 2-letter codes such as NG,
   * so we continue using those internally.
   */
  const selected =
    countries.find(
      (c) =>
        c.code === country ||
        c.alpha2 === country ||
        c.iso2 === country
    ) || defaultCountry;

  /*
   * Get the 3-letter code.
   *
   * This supports several possible names in your countries.js
   * so you don't have to completely rewrite the data structure.
   */
  const selectedIso3 =
    selected.iso3 ||
    selected.alpha3 ||
    selected.cca3 ||
    selected.code3 ||
    selected.code?.toUpperCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return countries;

    return countries.filter((c) => {
      const name = c.name?.toLowerCase() || "";
      const alpha2 = (
        c.alpha2 ||
        c.iso2 ||
        c.code ||
        ""
      ).toLowerCase();

      const iso3 = (
        c.iso3 ||
        c.alpha3 ||
        c.cca3 ||
        c.code3 ||
        ""
      ).toLowerCase();

      return (
        name.includes(q) ||
        alpha2.includes(q) ||
        iso3.includes(q)
      );
    });
  }, [query]);

  function handleSelect(selectedCountry) {
    /*
     * Keep using the country's 2-letter code internally because
     * that is what your existing CurrencyContext expects.
     */
    setCountry(
      selectedCountry.alpha2 ||
        selectedCountry.iso2 ||
        selectedCountry.code
    );

    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      {/* CLOSED SELECTOR */}
      <button
        type="button"
        aria-label="Select your country"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold"
      >
        <Flag
          code={
            selected.alpha2 ||
            selected.iso2 ||
            selected.code
          }
        />

        {/* 3-letter code shown when CLOSED */}
        <span>
          {selected.iso3 ||
            selected.alpha3 ||
            selected.cca3 ||
            selected.code3 ||
            selected.code?.toUpperCase()}
        </span>

        <ChevronDown
          size={18}
          className="shrink-0"
        />
      </button>

      {/* FULL-SCREEN COUNTRY MODAL */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select your country"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[538px] bg-white p-7 shadow-xl"
          >
            {/* HEADER */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--ink)]">
                Select Your Country
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <X size={22} />
              </button>
            </div>

            {/* CURRENT COUNTRY */}
            <div className="mb-4 flex h-[52px] items-center gap-3 border border-[var(--line-2)] px-4 text-sm">
              <Flag
                code={
                  selected.alpha2 ||
                  selected.iso2 ||
                  selected.code
                }
                className="h-4 w-6"
              />

              <span className="flex-1">
                {selected.name} (
                {selectedIso3})
              </span>

              <ChevronDown
                size={18}
                className="text-[var(--muted)]"
              />
            </div>

            {/* SEARCH */}
            <label className="relative mb-4 block">
              <span className="sr-only">
                Search for a country
              </span>

              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search for a country..."
                className="h-[52px] w-full border border-[var(--line)] py-2.5 pl-4 pr-11 text-sm outline-none focus:border-[var(--ink)]"
              />

              <Search
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
            </label>

            {/* COUNTRY LIST */}
            <div className="max-h-[320px] overflow-y-auto">
              {filtered.map((c) => {
                const alpha2 =
                  c.alpha2 ||
                  c.iso2 ||
                  c.code;

                const iso3 =
                  c.iso3 ||
                  c.alpha3 ||
                  c.cca3 ||
                  c.code3 ||
                  c.code?.toUpperCase();

                const isSelected =
                  alpha2 ===
                  (selected.alpha2 ||
                    selected.iso2 ||
                    selected.code);

                return (
                  <button
                    type="button"
                    key={alpha2}
                    onClick={() =>
                      handleSelect(c)
                    }
                    className="flex w-full items-center py-3 text-left text-sm transition hover:bg-[var(--cream)]"
                  >
                    {/* LEFT SIDE: FLAG + NAME */}
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Flag
                        code={alpha2}
                        className="h-4 w-6"
                      />

                      <span className="truncate text-[15px]">
                        {c.name}
                      </span>

                      {/* Currency if available */}
                      {c.currency && (
                        <span className="text-xs text-[var(--muted)]">
                          {c.currency}
                        </span>
                      )}
                    </span>

                    {/* ONLY CHECKMARK */}
                    {isSelected && (
                      <Check
                        size={17}
                        strokeWidth={2}
                        className="ml-3 shrink-0"
                      />
                    )}
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <p className="py-6 text-center text-xs text-[var(--muted)]">
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