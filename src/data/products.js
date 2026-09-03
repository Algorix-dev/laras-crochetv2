// TIP: keeping product data in its own file, separate from the
// components that display it, means when Lara sends real product
// photos and copy, you edit ONE file instead of hunting through
// JSX. Later this array could come from a backend/CMS instead —
// the components below wouldn't need to change at all.

import reinaFront from '../assets/reina-front.png';
import reinaThreeQuarter from '../assets/reina-three-quarter.png';
import reinaProfile from '../assets/reina-profile.png';
import reinaBack from '../assets/reina-back.png';
import modelTealSet from '../assets/model-teal-set.png';
import modelPinkSet from '../assets/model-pink-set.png';
import modelMustardSet from '../assets/model-mustard-set.png';
import modelBurgundySet from '../assets/model-burgundy-set.png';

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
  TIP: THIS REPLACES THE OLD "heroProduct" (one product, 5 camera
  angles). Per Lara's corrected brief, the hero strip is 5 DIFFERENT
  garments in 5 FIXED slots — clicking one doesn't reorder the row or
  slide anything to the middle, it just changes which slot is "the
  selected one" (facing front, full color/podium/name/price) while
  the rest face away and dim. See Hero.jsx.

  Only Reina has a real name + price from Lara so far. The other 4
  photos she sent (teal set, pink set, mustard set, burgundy set)
  don't have names/prices yet — those would normally come from her
  admin dashboard once it exists. The names below are PLACEHOLDERS
  so the UI has something to show; swap them for the real ones (and
  set the real `price`) the moment she gives them. Flagged clearly
  with `placeholder: true` so it's obvious in the UI code that these
  aren't final copy.
*/
export const heroModels = [
  {
    id: 'pink-set',
    name: 'Coral',
    placeholder: true,
    price: 70000,
    image: modelPinkSet,
    nameTop: '9%',
  },
  {
    id: 'teal-set',
    name: 'Marina',
    placeholder: true,
    price: 70000,
    image: modelTealSet,
    nameTop: '9%',
  },
  {
    id: 'reina',
    name: 'Reina',
    price: 70000,
    image: reinaFront,
    nameTop: '9%',
  },
  {
    id: 'mustard-set',
    name: 'Aurora',
    placeholder: true,
    price: 70000,
    image: modelMustardSet,
    nameTop: '5%',
  },
  {
    id: 'burgundy-set',
    name: 'Amara',
    placeholder: true,
    price: 70000,
    image: modelBurgundySet,
    nameTop: '7%',
  },
];

// Kept for anywhere still expecting angle-based Reina photography
// (e.g. a future product detail page gallery) — not used by Hero.jsx
// anymore.
export const reinaAngles = {
  front: reinaFront,
  threeQuarter: reinaThreeQuarter,
  profile: reinaProfile,
  back: reinaBack,
};
