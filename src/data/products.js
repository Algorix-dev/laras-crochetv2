/*
  Sample product data wired to the cropped images in model-images/.
  Drop that folder in as src/assets/models/ (or adjust the import
  paths below to wherever you keep it) and these imports resolve.

  WHY THESE IMAGES LOOK DIFFERENT FROM WHAT YOU UPLOADED:
  ------------------------------------------------------------
  The source photos had the model occupying only ~30-50% of the
  canvas width (huge invisible side padding baked into the file
  itself) — that's what was actually causing the "thin" look, not
  a CSS bug. Each image here has been cropped tightly to the real
  subject (using its alpha channel where the file had transparency,
  or background-color detection where it didn't), so the model now
  fills the frame properly. This is a one-time fix on the asset
  itself, not something CSS can do at render time.

  `angleImage` is only set where a genuine second angle/pose exists
  for that same piece (palm, sunset) — the rest are single-image
  for now, same "placeholder" pattern the original Hero component
  already expects for pieces without real multi-angle photography.
  `sunset`'s angleImage is a true turned/profile shot — that one in
  particular should look right in the mirrored flanking slots.
*/

import saharaFront from "../assets/model-images/sahara-front.png";
import wisteriaFront from "../assets/model-images/wisteria-front.png";
import rosewoodFront from "../assets/model-images/rosewood-front.png";
import palmFront from "../assets/model-images/palm-front.png";
import palmAngle from "../assets/model-images/palm-angle.png";
import lagoonFront from "../assets/model-images/lagoon-front.png";
import sunsetFront from "../assets/model-images/sunset-front.png";
import sunsetAngle from "../assets/model-images/sunset-angle.png";
import terraFront from "../assets/model-images/terra-front.png";

// ShopPage.jsx sends each of these slugs straight to your API as
// `getProducts(activeCategory)`, so these must match the `category`
// field values your MongoDB products actually have. Matches the
// Figma's 5 tabs — lowercase, hyphenated, since formatLabel() turns
// 'two-pieces' into 'Two Pieces' for display automatically.
export const CATEGORIES = ["dresses", "bikinis", "two-pieces", "shirts", "skirts"];

export const products = [
  {
    id: "wisteria",
    name: "Wisteria",
    price: 70000,
    image: wisteriaFront,
    angleImage: null,
    placeholder: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    price: 70000,
    image: sunsetFront,
    angleImage: sunsetAngle,
    placeholder: true,
  },
  {
    id: "palm",
    name: "Palm",
    price: 70000,
    image: palmFront,
    angleImage: palmAngle,
    placeholder: true,
  },
  {
    id: "rosewood",
    name: "Rosewood",
    price: 70000,
    image: rosewoodFront,
    angleImage: null,
    placeholder: true,
  },
  {
    id: "sahara",
    name: "Sahara",
    price: 70000,
    image: saharaFront,
    angleImage: null,
    placeholder: true,
  },
  {
    id: "lagoon",
    name: "Lagoon",
    price: 70000,
    image: lagoonFront,
    angleImage: null,
    placeholder: true,
  },
  {
    id: "terra",
    name: "Terra",
    price: 70000,
    image: terraFront,
    angleImage: null,
    placeholder: true,
  },
];

// Hero only ever shows 5 slots at once — first 5 products by default.
export const heroModels = products.slice(0, 5);