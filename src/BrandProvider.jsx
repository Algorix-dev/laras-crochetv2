/*
  BRAND PROVIDER — loads Lara's brand settings once when the site opens
  (GET /api/brand, set on the admin Brand page) and applies them:
    - favicon (browser tab icon)
    - main colour (overrides --maroon / --maroon-dark in index.css)
    - links the footer shows (Instagram, TikTok, WhatsApp, email) and the logo
  Anything Lara leaves empty keeps the site's built-in default, and if the
  request fails the shop simply looks as it always did.
*/
import { createContext, useContext, useEffect, useState } from "react";
import { getBrand } from "./api";

const BrandContext = createContext({});

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({});

  useEffect(() => {
    let cancelled = false;
    getBrand()
      .then((b) => !cancelled && setBrand(b))
      .catch(() => {}); // keep the defaults
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (brand.primaryColor) {
      root.style.setProperty("--maroon", brand.primaryColor);
      // hover/dark state: the same colour mixed with black
      root.style.setProperty("--maroon-dark", `color-mix(in srgb, ${brand.primaryColor} 75%, black)`);
    } else {
      root.style.removeProperty("--maroon");
      root.style.removeProperty("--maroon-dark");
    }
    if (brand.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = brand.faviconUrl;
    }
  }, [brand]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
