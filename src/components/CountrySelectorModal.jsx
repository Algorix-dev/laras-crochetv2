import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, defaultCountry, countryToCurrency } from "../data/countries";
import { useCurrency } from "../context/CurrencyContext";

/*
 * ISO 3166-1 alpha-3 codes for the countries currently
 * included in data/countries.js.
 */
const ISO3 = {
  NG: "NGA",
  DZ: "DZA",
  AO: "AGO",
  BJ: "BEN",
  BW: "BWA",
  BF: "BFA",
  BI: "BDI",
  CM: "CMR",
  CV: "CPV",
  CF: "CAF",
  TD: "TCD",
  KM: "COM",
  CG: "COG",
  CD: "COD",
  DJ: "DJI",
  EG: "EGY",
  GQ: "GNQ",
  ER: "ERI",
  SZ: "SWZ",
  ET: "ETH",
  GA: "GAB",
  GM: "GMB",
  GH: "GHA",
  GN: "GIN",
  GW: "GNB",
  CI: "CIV",
  KE: "KEN",
  LS: "LSO",
  LR: "LBR",
  LY: "LBY",
  MG: "MDG",
  MW: "MWI",
  ML: "MLI",
  MR: "MRT",
  MU: "MUS",
  MA: "MAR",
  MZ: "MOZ",
  NA: "NAM",
  NE: "NER",
  RW: "RWA",
  ST: "STP",
  SN: "SEN",
  SC: "SYC",
  SL: "SLE",
  SO: "SOM",
  ZA: "ZAF",
  SS: "SSD",
  SD: "SDN",
  TZ: "TZA",
  TG: "TGO",
  TN: "TUN",
  UG: "UGA",
  ZM: "ZMB",
  ZW: "ZWE",

  GB: "GBR",
  US: "USA",
  CA: "CAN",
  FR: "FRA",
  DE: "DEU",
  IE: "IRL",
  AE: "ARE",
  BR: "BRA",
  IN: "IND",
  AU: "AUS",
};

function getCurrency(country) {
  return countryToCurrency[country.code] || "USD";
}

export default function CountrySelectorModal() {
  const { country, setCountry } = useCurrency();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected =
    countries.find((c) => c.code === country) || defaultCountry;

  const selectedISO3 = ISO3[selected.code] || selected.code;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return countries;

    return countries.filter((c) => {
      const iso3 = ISO3[c.code] || "";

      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        iso3.toLowerCase().includes(q)
      );
    });
  }, [query]);

  function handleSelect(selectedCountry) {
    setCountry(selectedCountry.code);
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
        className="flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-[10px] bg-[#E5E5E5] px-3 text-sm font-semibold text-[#404040]"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {selected.flag}
        </span>

        <span>{selectedISO3}</span>

        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className="shrink-0"
        />
      </button>

      {/* FULL SCREEN OVERLAY */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="country-selector-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5 py-5"
          onClick={() => setOpen(false)}
        >
          {/* MODAL */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              box-border
              flex
              h-auto
              w-full
              max-w-[470px]
              flex-col
              items-center
              gap-10
              border
              border-[#E5E5E5]
              bg-[#FAFAFA]
              px-[60px]
              py-10
              shadow-[0px_1px_3px_rgba(0,0,0,0.25)]
            "
          >
            {/* HEADER */}
            <div className="flex w-full items-center gap-[10px]">
              <h2
                id="country-selector-title"
                className="
                  flex-1
                  text-center
                  text-[24px]
                  font-bold
                  leading-8
                  text-[#404040]
                "
              >
                Select Your Country
              </h2>

              <button
                type="button"
                aria-label="Close country selector"
                onClick={() => setOpen(false)}
                className="shrink-0 text-[#737373] hover:text-[#404040]"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* COUNTRY DROPDOWN AREA */}
            <div className="flex w-full flex-col items-end gap-[6px]">
              {/* CURRENT COUNTRY */}
              <div
                className="
                  box-border
                  flex
                  h-[49px]
                  w-full
                  items-center
                  justify-between
                  border
                  border-[#A3A3A3]
                  px-4
                  py-[6px]
                "
              >
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[20px] leading-none"
                  >
                    {selected.flag}
                  </span>

                  <span className="truncate text-[16px] font-semibold leading-6 text-[#404040]">
                    {selected.name} ({getCurrency(selected)})
                  </span>
                </div>

                <ChevronDown
                  size={24}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#404040]"
                />
              </div>

              {/* SEARCH */}
              <div className="relative w-full">
                <label htmlFor="country-search" className="sr-only">
                  Search for a country
                </label>

                <input
                  id="country-search"
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a country..."
                  className="
                    box-border
                    h-[50px]
                    w-full
                    border
                    border-[#A3A3A3]
                    bg-[#FAFAFA]
                    py-[6px]
                    pl-4
                    pr-12
                    text-[16px]
                    font-normal
                    leading-6
                    text-[#404040]
                    outline-none
                    placeholder:text-[#A3A3A3]
                    focus:border-[#404040]
                  "
                />

                <Search
                  size={24}
                  strokeWidth={1.5}
                  className="
                    pointer-events-none
                    absolute
                    right-[17px]
                    top-1/2
                    -translate-y-1/2
                    text-[#404040]
                  "
                />
              </div>

              {/* COUNTRY LIST */}
              <div
                className="
                  flex
                  h-[276px]
                  w-full
                  flex-row
                  overflow-hidden
                  bg-[#FAFAFA]
                "
              >
                {/* LIST CONTENT */}
                <div className="min-w-0 flex-1 overflow-y-auto pr-2">
                  <div className="flex flex-col gap-5">
                    {filtered.map((c) => {
                      const iso3 = ISO3[c.code] || c.code;
                      const currency = getCurrency(c);
                      const isSelected = c.code === selected.code;

                      return (
                        <button
                          type="button"
                          key={c.code}
                          onClick={() => handleSelect(c)}
                          className="
                            flex
                            min-h-6
                            w-full
                            items-center
                            justify-between
                            text-left
                            text-[16px]
                            leading-6
                            hover:bg-[#F5F0F0]
                          "
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-[18px] leading-none"
                            >
                              {c.flag}
                            </span>

                            <span className="truncate font-medium text-[#404040]">
                              {c.name}
                            </span>

                            <span className="shrink-0 font-medium text-[#737373]">
                              ({currency})
                            </span>
                          </span>

                          {/* ONLY SHOW CHECK FOR SELECTED COUNTRY */}
                          {isSelected && (
                            <Check
                              size={24}
                              strokeWidth={1.5}
                              className="ml-3 shrink-0 text-[#412B2D]"
                            />
                          )}
                        </button>
                      );
                    })}

                    {filtered.length === 0 && (
                      <p className="py-4 text-center text-sm text-[#737373]">
                        No countries match &quot;{query}&quot;.
                      </p>
                    )}
                  </div>
                </div>

                {/* SCROLLBAR AREA — styled to resemble Figma */}
                <div className="w-[18px] shrink-0 bg-[#FFFCFC] px-[6px] py-2">
                  <div className="h-full w-[6px] rounded-full border border-white bg-black/15">
                    <div className="h-[152px] w-full rounded-full bg-black/15" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}