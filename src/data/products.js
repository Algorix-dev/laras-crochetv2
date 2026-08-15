// TIP: keeping product data in its own file, separate from the
// components that display it, means when Lara sends real product
// photos and copy, you edit ONE file instead of hunting through
// JSX. Later this array could come from a backend/CMS instead —
// the components below wouldn't need to change at all.

import reinaFront from '../assets/reina-front.png';
import reinaThreeQuarter from '../assets/reina-three-quarter.png';
import reinaProfile from '../assets/reina-profile.png';
import reinaBack from '../assets/reina-back.png';

// TIP: `category` drives the filter tabs on the Shop page
// (Dresses / Bikinis / Two-Pieces / Shirts / Skirts). Since only
// Reina exists right now, everything is 'dresses' as a placeholder —
// when Lara sends more product types, set each one's real category
// and the tabs will start actually splitting the grid.
export const CATEGORIES = ['dresses', 'bikinis', 'two-pieces', 'shirts', 'skirts'];

export const products = [
  {
    id: 'reina',
    name: 'Reina',
    price: 70000,
    image: reinaFront,
    category: 'dresses',
    colors: ['#1c1c22', '#22304a', '#9aa5ad'],
    shades: ['#e9e6e0', '#22304a', '#9aa5ad', '#b7bcc2', '#8b9096'],
    sizes: ['XS', 'S', 'M', 'XL', 'XXL'],
  },
  {
    id: 'reina-2',
    name: 'Reina',
    price: 70000,
    image: reinaFront,
    category: 'dresses',
    colors: ['#1c1c22', '#22304a', '#9aa5ad'],
    shades: ['#e9e6e0', '#22304a'],
    sizes: ['XS', 'S', 'M', 'XL', 'XXL'],
  },
  {
    id: 'reina-3',
    name: 'Reina',
    price: 70000,
    image: reinaFront,
    category: 'dresses',
    colors: ['#1c1c22', '#22304a', '#9aa5ad'],
    shades: ['#e9e6e0', '#22304a'],
    sizes: ['XS', 'S', 'M', 'XL', 'XXL'],
  },
];

// TIP ON SWAPPING IMAGES YOURSELF:
// 1. Drop your image file into src/assets/ (e.g. src/assets/amara.png)
// 2. Import it at the top of this file: import amara from '../assets/amara.png';
// 3. Set it as the `image` field on the product object below: image: amara

/*
  TIP: this is now ONE product shown from five camera angles, not
  five different products — that was the mistake in the earlier
  version. We only shot four real angles (front, a 3/4 turn, a
  full side profile, and the back), all facing left. Real product
  shoots often only cover one side and rely on the body being
  roughly symmetrical, so the two RIGHT-facing slots below reuse
  the left-facing photos with `flip: true` — Hero.jsx mirrors them
  with a CSS transform (scaleX(-1)) rather than needing two
  separate photos. It's a real technique, not a hack, but flag it
  to Lara so she knows why "5 angles" is really "4 photos."
  The back view isn't used here (a straight-on hero doesn't really
  have a "back" slot) — it's a natural fit for the product detail
  page thumbnails once that's built.
*/
export const heroProduct = {
  id: 'reina',
  name: 'Reina',
  price: 70000,
  angles: [
    { src: reinaProfile, flip: false },      // far left: full left profile
    { src: reinaThreeQuarter, flip: false }, // inner left: 3/4 turn
    { src: reinaFront, flip: false },        // center: front on
    { src: reinaThreeQuarter, flip: true },  // inner right: mirrored 3/4 turn
    { src: reinaProfile, flip: true },       // far right: mirrored profile
  ],
};

export const reinaBackView = reinaBack;
