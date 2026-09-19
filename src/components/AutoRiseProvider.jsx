import { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initScrollReveal, scanAndRegisterElements } from "../utils/scrollReveal";

const AutoRiseContext = createContext({
  refreshReveal: () => {},
});

export function useScrollReveal() {
  return useContext(AutoRiseContext);
}

/**
 * AutoRiseProvider
 *
 * Mounts at the app root, initializes the global scroll-triggered
 * animation engine from Emmanuel's Algorix Portfolio, and re-scans
 * dynamically whenever routes change or new content mounts.
 */
export function AutoRiseProvider({ children }) {
  const { pathname } = useLocation();

  // Initialize the engine on mount
  useEffect(() => {
    const teardown = initScrollReveal();
    return () => teardown();
  }, []);

  // Re-scan when pathname changes
  useEffect(() => {
    // Wait for the route change to render into the DOM
    const timer = setTimeout(() => {
      scanAndRegisterElements(document.body);
    }, 40);

    return () => clearTimeout(timer);
  }, [pathname]);

  const refreshReveal = () => {
    scanAndRegisterElements(document.body);
  };

  return (
    <AutoRiseContext.Provider value={{ refreshReveal }}>
      {children}
    </AutoRiseContext.Provider>
  );
}

export default AutoRiseProvider;
