import { createContext, useContext, useState } from "react";

/*
  Shared, app-wide switch for "should the navbar be visible right
  now." LaraShowcase sets this to true while it's actively pinned
  and scrubbing, so the navbar disappears entirely during that
  animation and reappears the instant it releases (or if the user
  scrolls back up before it finishes). Any future full-screen /
  pinned section can reuse the same mechanism just by calling
  setHidden itself — Navbar.jsx doesn't need to know which section
  is asking.

  Defaults to `hidden: false` / a no-op setHidden so that if a
  component ever calls useNavbarVisibility() outside the provider
  (e.g. during setup before App.jsx is wired up), nothing throws —
  it just behaves as if the navbar is always visible.
*/
const NavbarVisibilityContext = createContext({
  hidden: false,
  setHidden: () => {},
});

export function NavbarVisibilityProvider({ children }) {
  const [hidden, setHidden] = useState(false);

  return (
    <NavbarVisibilityContext.Provider value={{ hidden, setHidden }}>
      {children}
    </NavbarVisibilityContext.Provider>
  );
}

export function useNavbarVisibility() {
  return useContext(NavbarVisibilityContext);
}