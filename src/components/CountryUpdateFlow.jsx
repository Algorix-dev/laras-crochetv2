import { ChevronDown, Search, X, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, defaultCountry, countryToCurrency } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

// Fallback: any country not explicitly mapped defaults to USD
function currencyFor(code) {
  return countryToCurrency[code] || "USD";
}

export default function CountrySelector() {
  const { country, setCountry } = useCurrency();

  const [step, setStep] = useState("closed"); // "closed" | "picking" | "confirming"
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(country);

  const selected = countries.find((c) => c.code === country) || defaultCountry;
  const pendingCountry = countries.find((c) => c.code === pending) || defaultCountry;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q)
    );
  }, [query]);

  function openModal() {
    setPending(country);
    setStep("picking");
  }

  function pickCountry(c) {
    setPending(c.code);
    setStep("confirming");
  }

  function confirmUpdate() {
    setCountry(pending);
    close();
  }

  function close() {
    setStep("closed");
    setQuery("");
  }

  return (
    <div className="relative">
      {/* CLOSED SELECTOR */}
      <button
        type="button"
        aria-label="Select your country"
        onClick={openModal}
        className="flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span>{selected.iso3}</span>
        <ChevronDown size={18} className="shrink-0" />
      </button>

      {step !== "closed" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-xl bg-white p-7 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--ink)]">
                Select Your Country
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X size={22} />
              </button>
            </div>

            {/* STEP 1: PICKING */}
            {step === "picking" && (
              <>
                <label className="relative mb-4 block">
                  <span className="sr-only">Search for a country</span>
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a country..."
                    className="h-[52px] w-full border border-[var(--line)] py-2.5 pl-4 pr-11 text-sm outline-none focus:border-[var(--ink)]"
                  />
                  <Search
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                </label>

                <div className="max-h-[320px] overflow-y-auto">
                  {filtered.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => pickCountry(c)}
                      className="flex w-full items-center py-3 text-left text-sm hover:bg-[var(--cream)]"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="text-lg leading-none">{c.flag}</span>
                        <span className="truncate text-[15px]">{c.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {currencyFor(c.code)}
                        </span>
                      </span>
                      {c.code === country && <Check size={17} />}
                    </button>
                  ))}

                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-xs text-[var(--muted)]">
                      No countries match "{query}".
                    </p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: CONFIRMING */}
            {step === "confirming" && (
              <div className="mx-auto max-w-[360px]">
                <div className="mb-4 flex h-[52px] items-center gap-3 rounded-md border border-[var(--line-2)] px-4 text-sm">
                  <span className="text-lg leading-none">{pendingCountry.flag}</span>
                  <span className="flex-1">
                    {pendingCountry.name} ({currencyFor(pendingCountry.code)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("picking")}
                    className="text-xs font-semibold text-[var(--muted)] underline"
                  >
                    Change
                  </button>
                </div>

                <button
                  type="button"
                  onClick={confirmUpdate}
                  className="h-11 w-full rounded-md bg-[#372A2B] text-xs font-bold uppercase tracking-wide text-white"
                >
                  Update Country
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}