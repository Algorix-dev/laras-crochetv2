/* TIP: Prices are stored in NGN in products.js; this context only changes
   how they are displayed. The underlying data never changes — only the
   presentation layer adapts to the user's currency preference. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* TIP: createContext() makes the "bucket" for currency state.
   Any component inside <CurrencyProvider> can reach into this bucket. */
const CurrencyContext = createContext(null);

/* TIP: We export the currencies object so other parts of the app (like a
   currency selector dropdown) can read the available options without
   duplicating the data. Keeping data in one place is called a
   "single source of truth." */
export const currencies = {
  NGN: { rate: 1, locale: 'en-NG', label: 'NGN' },
  /* TIP: rate = how many NGN equal 1 of this currency.
      1 USD = 1,550 NGN  →  to show USD, divide NGN price by 1550.
      1 GBP = 1,950 NGN  →  to show GBP, divide NGN price by 1950.
      NGN rate is 1 because it's the base currency (no conversion needed). */
  USD: { rate: 1550, locale: 'en-US', label: 'USD' },
  GBP: { rate: 1950, locale: 'en-GB', label: 'GBP' },
};

/* TIP: The Provider wraps your app and makes the currency context available
   to every child component. We put it near the root of the app (in
   main.jsx or App.jsx) so all components can access it. */
export function CurrencyProvider({ children }) {
  /* TIP: Lazy initializer function — reads localStorage only once on mount.
     Falls back to 'NGN' if the user hasn't chosen a currency yet. */
  const [currency, setCurrency] = useState(() =>
    localStorage.getItem('laras-currency') || 'NGN'
  );

  /* TIP: This effect persists the user's currency choice to localStorage
     whenever it changes. The dependency array [currency] means "only run
     when currency updates." This way the preference survives page refreshes. */
  useEffect(() => {
    localStorage.setItem('laras-currency', currency);
  }, [currency]);

  /* TIP: useMemo() caches the context value object so React doesn't
     recreate it on every render. Without useMemo, every component using
     useCurrency() would re-render on every parent re-render, even if the
     currency didn't actually change. */
  const value = useMemo(
    () => ({
      currency,
      setCurrency,

      /* TIP: formatPrice is a helper function included in the context so any
         component can convert an NGN price to the user's chosen currency.
         It uses Intl.NumberFormat — a built-in browser API for formatting
         numbers as currency (handles symbols, commas, decimals automatically).
         
         Example: formatPrice(15500) with USD selected → "$10.00"
                  formatPrice(15500) with NGN selected → "₦15,500" */
      formatPrice: (ngn) =>
        new Intl.NumberFormat(currencies[currency].locale, {
          style: 'currency',
          currency,
          /* TIP: NGN doesn't use kobo in everyday pricing, so we show 0
             decimal places. USD and GBP show 2 decimals for cents/pence. */
          maximumFractionDigits: currency === 'NGN' ? 0 : 2,
        }).format(ngn / currencies[currency].rate),
    }),
    [currency]
  );

  /* TIP: The Provider passes `value` down to all children. Any component
     inside can call useCurrency() to get { currency, setCurrency, formatPrice }. */
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/* TIP: Custom hook — any component inside <CurrencyProvider> can simply write:
   const { formatPrice, currency } = useCurrency();
   This is much cleaner than calling useContext(CurrencyContext) every time. */
export function useCurrency() {
  const value = useContext(CurrencyContext);

  /* TIP: Safety check — if someone accidentally calls useCurrency() outside
     of a CurrencyProvider, they get a clear error instead of a silent crash. */
  if (!value) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return value;
}