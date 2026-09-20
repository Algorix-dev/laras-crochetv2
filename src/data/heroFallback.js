/*
  HERO FALLBACK — only used until Lara has put real pieces on the hero.

  The hero is now driven by the products themselves: any piece she marks
  "Hero" in the admin page shows up in the carousel. But on a brand-new
  database nothing is marked yet, and (like the Shop's static fallback)
  the landing page shouldn't be empty in the meantime. So while NO piece
  is on the hero — or if the API can't be reached — these sample models
  are shown instead.

  TIP — TO REMOVE THIS ONCE THE REAL HERO PIECES EXIST:
  delete this file, delete the `FALLBACK_HERO_MODELS` import in App.jsx,
  and replace the two places that use it with `[]`.

  Each model has up to three photos:
    front : facing the camera — shown when it's in the middle
    left  : turned toward the left of the screen  — shown on the left side
    right : turned toward the right of the screen — shown on the right side
  A missing side photo is mirrored from the other one; with neither, the
  front photo is used.
*/

import model2 from "../assets/model-images/model-coral.webp";
import model3 from "../assets/model-images/model-marina.webp";
import model5 from "../assets/model-images/model-sienna.webp";
import model6 from "../assets/model-images/model-amber.webp";
import heroCenter from "../assets/reina-front.webp";

export const FALLBACK_HERO_MODELS = [
  { id: "fallback-coral", name: "Coral", price: 70000, views: { front: null, left: model2, right: null } },
  { id: "fallback-amber", name: "Amber", price: 70000, views: { front: null, left: model6, right: null } },
  { id: "fallback-reina", name: "Reina", price: 70000, views: { front: heroCenter, left: null, right: null } },
  { id: "fallback-sienna", name: "Sienna", price: 70000, views: { front: null, left: null, right: model5 } },
  { id: "fallback-marina", name: "Marina", price: 70000, views: { front: null, left: null, right: model3 } },
];
