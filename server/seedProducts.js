// Run once with: node seedProducts.js
// Adds test products to your live database so the frontend has
// something real to fetch once it's wired to the API.
//
// TIP: images below are REAL photos now — cropped directly from the
// Figma Shop Page export (public/images/reina-*.jpg in the frontend
// repo) instead of colored placeholder rectangles. All 8 are the same
// "Reina" two-piece garment in different colorways (that's the only
// product Lara's photographed so far) — spread across 5 categories
// here isn't claiming they're different garments, it's just so Shop's
// category tabs and My Bag actually have something in every tab to
// filter/add and test with, until real photos for other garment types
// exist. Swap in real category-appropriate photos once she has them.
//
// TIP: this checks PER CATEGORY instead of bailing out the moment any
// product exists at all — that part is unchanged and still matters
// (the old all-or-nothing check meant that once "dresses" got seeded,
// re-running this script silently did nothing for bikinis/two-pieces/
// shirts/skirts, which is why Shop looked empty on every tab but
// Dresses).
//
// TIP (the actual bug fix): it now ALSO upserts by name within a
// category that's already seeded, instead of always skipping. Before,
// once "skirts" had any product in it (even Nneka's very first
// placehold.co placeholder image), this script would see
// `existing > 0` and skip the whole category forever — so updating
// Nneka's `images` array above to the 3 real photos never actually
// reached the database, no matter how many times you reran this file.
// Now: a brand-new category still gets its product created (as
// before), but a product with a matching `name` in an existing
// category gets its fields updated in place. Safe to re-run any time.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';

await connectDB();

const testProducts = [
  {
    name: 'Reina',
    price: 70000,
    category: 'dresses',
    images: ['/images/reina-teal.jpg', '/images/reina-turquoise-set.jpg'],
    colors: ['#1c1c22', '#22304a', '#9aa5ad'],
    shades: ['#e9e6e0', '#22304a', '#9aa5ad', '#b7bcc2', '#8b9096'],
    sizes: ['XS', 'S', 'M', 'XL', 'XXL'],
    stock: 10,
    description: 'Hand-crocheted from premium yarn. Made to order from Lagos, Nigeria.',
  },
  {
    name: 'Amara',
    price: 55000,
    category: 'bikinis',
    images: ['/images/reina-mustard.jpg'],
    colors: ['#6b4c4f', '#c9aeb4'],
    shades: ['#f5efe9', '#c9aeb4'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 15,
    description: 'A two-piece bikini set, hand-crocheted with adjustable ties.',
  },
  {
    name: 'Zuri',
    price: 62000,
    category: 'two-pieces',
    images: ['/images/reina-burgundy.jpg'],
    colors: ['#22304a', '#9aa5ad'],
    shades: ['#e9e6e0', '#9aa5ad'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    description: 'A matching crop top and skirt two-piece set.',
  },
  {
    name: 'Femi',
    price: 48000,
    category: 'shirts',
    images: ['/images/reina-green.jpg'],
    colors: ['#8b9096', '#1c1c22'],
    shades: ['#1c1c22', '#8b9096'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 12,
    description: 'A relaxed-fit crochet shirt, made to order.',
  },
  {
    name: 'Nneka',
    price: 39000,
    category: 'skirts',
    images: ['/images/reina-lilac.jpg', '/images/reina-orange.jpg', '/images/reina-brown.jpg'],
    colors: ['#b7bcc2'],
    shades: ['#1c1c22', '#b7bcc2', '#9aa5ad'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 20,
    description: 'A midi-length crochet skirt with a flowing silhouette.',
  },
];

let created = 0;
let updated = 0;
for (const product of testProducts) {
  const categoryCount = await Product.countDocuments({ category: product.category });

  if (categoryCount === 0) {
    await Product.create(product);
    created += 1;
    console.log(`Seeded "${product.name}" into "${product.category}" (new category).`);
    continue;
  }

  // TIP: `upsert: true` here means "update this doc if a product with
  // this name already exists, otherwise create it" — so editing e.g.
  // Nneka's `images` array above and rerunning this script will now
  // actually push that change to the database, instead of silently
  // skipping because "skirts" already had something in it.
  const result = await Product.findOneAndUpdate(
    { name: product.name },
    product,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  updated += 1;
  console.log(`Upserted "${result.name}" (${product.category}).`);
}

console.log(
  `Done — ${created} new categor${created === 1 ? 'y' : 'ies'} seeded, ${updated} product(s) upserted.`
);

await mongoose.disconnect();