import { createContext, useContext, useState } from "react";

/*
  Lets LaraShowcase (or any future pinned/full-screen sequence)
  tell the navbar to disappear entirely while it's actively
  scrubbing, and reappear once it's done. Global so it works the
  same way on every page, not just the homepage.
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