/* TIP: Context is React's way to share state across the whole app without
   passing props down through every single component (no "prop drilling").
   Think of it as a global bucket that any component can reach into. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* TIP: createContext() makes the "bucket". The initial value (null) is just
   a fallback — the real value comes from the Provider component below. */
const WishlistContext = createContext(null);

/* TIP: We use a CustomEvent ('lara-toast') to broadcast a toast notification
   to the rest of the app. This is a lightweight pub/sub pattern — no extra
   library needed. The Toast component listens for this event. */
const notify = (message) =>
  window.dispatchEvent(new CustomEvent('lara-toast', { detail: message }));

/* TIP: The Provider component wraps part of your app and makes the context
   value available to every child inside it. Only components inside
   <WishlistProvider> can call useWishlist(). */
export function WishlistProvider({ children }) {
  /* TIP: useState accepts a function (lazy initializer) so we only read
     localStorage once when the component mounts — not on every re-render. */
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('laras-wishlist')) || [];
    } catch {
      return [];
    }
  });

  /* TIP: This effect syncs the wishlist to localStorage whenever it changes.
     The dependency array [wishlistItems] means "run this only when
     wishlistItems updates." This is how React knows when to re-run effects. */
  useEffect(() => {
    localStorage.setItem('laras-wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  /* TIP: useMemo() caches the computed value so React doesn't recreate the
     object on every render. Without it, every child consuming this context
     would re-render even if the wishlist didn't actually change.
     The dependency array [wishlistItems] tells React when to recompute. */
  const value = useMemo(
    () => ({
      wishlistItems,

      /* TIP: Derived value — computed from state, not stored separately.
         This keeps the source of truth in one place. */
      wishlistCount: wishlistItems.length,

      /* TIP: Helper function to check if a product is in the wishlist.
         We include it in the context value so any component can call it. */
      isInWishlist: (productId) => wishlistItems.includes(productId),

      /* TIP: toggleWishlist uses the functional updater form of setState
         (items => ...) so it always reads the latest state, even if multiple
         toggles happen in quick succession. */
      toggleWishlist: (productId) =>
        setWishlistItems((items) => {
          const included = items.includes(productId);

          /* TIP: Fire the toast notification based on the action. */
          notify(
            included ? 'Removed from wishlist' : 'Added to wishlist'
          );

          /* TIP: We return a NEW array (spread or filter) so React can detect
             the change. Mutating the existing array in place would NOT trigger
             a re-render — React compares object references, not contents. */
          return included
            ? items.filter((id) => id !== productId)
            : [...items, productId];
        }),
    }),
    [wishlistItems]
  );

  /* TIP: We pass `value` to the Provider so every child can access it via
     useContext(WishlistContext). The `children` prop is whatever JSX is
     wrapped inside <WishlistProvider> in the component tree. */
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

/* TIP: Custom hooks are just functions that start with "use" — they can call
   other hooks like useContext(). This hook lets any component inside the
   Provider simply write `const { toggleWishlist } = useWishlist()` instead
   of calling useContext manually every time. */
export function useWishlist() {
  const value = useContext(WishlistContext);

  /* TIP: This guard catches mistakes — if someone calls useWishlist() outside
     of a WishlistProvider, they'll get a clear error message instead of a
     cryptic "cannot read properties of null" crash. */
  if (!value) {
    throw new Error(
      'useWishlist must be used within a WishlistProvider'
    );
  }

  return value;
}