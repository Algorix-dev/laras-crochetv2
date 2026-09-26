/* TIP: Prices are stored in NGN in products.js; this context only changes
   how they are displayed. The underlying data never changes — only the
   presentation layer adapts to the user's currency preference. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { countryToCurrency, defaultCountry } from '../data/countries';

const CurrencyContext = createContext(null);

/* TIP: metadata that never changes — the exchange RATE is the only
   thing that goes live now. locale/label stay here so a currency
   selector dropdown can list options without waiting on a network
   call. NGN is the base currency products are actually priced in,
   so its rate is always exactly 1 — it's never fetched. */
export const currencyMeta = {
  NGN: { locale: 'en-NG', label: 'NGN' },
  USD: { locale: 'en-US', label: 'USD' },
  GBP: { locale: 'en-GB', label: 'GBP' },
  EUR: { locale: 'en-DE', label: 'EUR' },
};

/* TIP: kept ONLY as a fallback — used for the first paint before the
   first live fetch resolves, and if the rate API is ever unreachable
   (offline, outage, ad-blocker). Nudge these every few months so the
   "no internet" experience doesn't drift too far from reality — but
   normal browsing no longer depends on them. */
const FALLBACK_RATES = { NGN: 1, USD: 1550, GBP: 1950, EUR: 1680 };

/* TIP: back-compat export, in case anything elsewhere imports
   { currencies } expecting { rate, locale, label } per code (e.g. a
   currency-selector dropdown). Real formatting always uses the live
   `rates` from context below, not this static object. */
export const currencies = Object.fromEntries(
  Object.entries(currencyMeta).map(([code, meta]) => [
    code,
    { ...meta, rate: FALLBACK_RATES[code] },
  ])
);

const RATES_CACHE_KEY = 'laras-rates-cache';
const RATES_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

/* TIP: open.er-api.com is a free, keyless exchange-rate API (the open
   mirror of exchangerate-api.com). Its numbers refresh roughly once a
   day — that's the honest ceiling for "real-time" without a paid
   plan. Basing the request on NGN means every value it returns is
   "X units of that currency per 1 naira" — the reciprocal of what
   formatPrice needs (naira per 1 unit of X), hence the `1 / perNaira`
   below. */
async function fetchLiveRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/NGN');
  if (!res.ok) throw new Error('rate fetch failed');

  const data = await res.json();
  if (data.result !== 'success') throw new Error('rate fetch failed');

  const rates = { NGN: 1 };
  for (const code of Object.keys(currencyMeta)) {
    if (code === 'NGN') continue;
    const perNaira = data.rates[code];
    if (perNaira) rates[code] = 1 / perNaira;
  }
  return rates;
}

function readCache() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() =>
    localStorage.getItem('laras-currency') || 'NGN'
  );

  const [country, setCountryCode] = useState(() =>
    localStorage.getItem('laras-country') || defaultCountry.code
  );

  /* TIP: rates start from whatever's cached in localStorage — so a
     returning visitor sees yesterday's real rates INSTANTLY, no
     waiting on a network request just to render a price — and only
     fall back to FALLBACK_RATES on a first-ever visit or cleared
     storage. */
  const [rates, setRates] = useState(() => readCache()?.rates || FALLBACK_RATES);
  const [ratesFetchedAt, setRatesFetchedAt] = useState(() => readCache()?.fetchedAt || null);

  useEffect(() => {
    localStorage.setItem('laras-country', country);
  }, [country]);

  useEffect(() => {
    localStorage.setItem('laras-currency', currency);
  }, [currency]);

  /* TIP: only refetches if the cached rates are older than
     RATES_MAX_AGE_MS. CurrencyProvider mounts once near the app root
     and stays mounted, so without this check every page navigation
     within the same visit would refetch for no reason. */
  useEffect(() => {
    const isStale = !ratesFetchedAt || Date.now() - ratesFetchedAt > RATES_MAX_AGE_MS;
    if (!isStale) return undefined;

    let cancelled = false;

    fetchLiveRates()
      .then((liveRates) => {
        if (cancelled) return;
        const fetchedAt = Date.now();
        setRates(liveRates);
        setRatesFetchedAt(fetchedAt);
        localStorage.setItem(
          RATES_CACHE_KEY,
          JSON.stringify({ rates: liveRates, fetchedAt })
        );
      })
      .catch(() => {
        // TIP: silent on purpose — if the rate API is down, the site
        // just keeps using cached/fallback rates instead of surfacing
        // an error over something as small as a currency toggle.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCountry = (code) => {
    setCountryCode(code);
    setCurrency(countryToCurrency[code] || 'USD');
  };

  const value = useMemo(() => {
    const rate = rates[currency] || rates['USD'] || 1;
    const locale = currencyMeta[currency]?.locale || 'en-US';
    const currencyCode = currencyMeta[currency] ? currency : 'USD';

    return {
      currency,
      setCurrency,
      country,
      setCountry,
      ratesFetchedAt,

      formatPrice: (ngn) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: currency === 'NGN' ? 0 : 2,
        }).format(ngn / rate),

      formatPriceNumber: (ngn) =>
        new Intl.NumberFormat(locale, {
          maximumFractionDigits: currency === 'NGN' ? 0 : 2,
        }).format(ngn / rate),
    };
  }, [currency, country, rates, ratesFetchedAt]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return value;
}