// Run once with: node seedProducts.js
// Adds test products to your live database so the frontend has
// something real to fetch once it's wired to the API.
//
// TIP: image URLs below are placeholders, NOT the real Lara's Crochet
// photos — those live locally in src/assets and were never uploaded to
// Cloudinary. Once the admin panel exists (or you upload manually via
// POST /api/upload), replace these with real Cloudinary URLs. This
// script exists purely to test that "product in database" → "product
// shows on site" actually works end to end, across every category
// (so Shop's category tabs and My Bag actually have something to
// filter/add), not just prove one product renders.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';

await connectDB();

const existingCount = await Product.countDocuments();
if (existingCount > 0) {
  console.log(`${existingCount} product(s) already in the database — nothing to seed.`);
} else {
  await Product.create([
    {
      name: 'Reina',
      price: 70000,
      category: 'dresses',
      images: ['https://placehold.co/600x800/1c1c22/e9e6e0?text=Reina'],
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
      images: ['https://placehold.co/600x800/6b4c4f/f5efe9?text=Amara'],
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
      images: ['https://placehold.co/600x800/22304a/e9e6e0?text=Zuri'],
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
      images: ['https://placehold.co/600x800/8b9096/1c1c22?text=Femi'],
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
      images: ['https://placehold.co/600x800/b7bcc2/1c1c22?text=Nneka'],
      colors: ['#b7bcc2'],
      shades: ['#1c1c22', '#b7bcc2', '#9aa5ad'],
      sizes: ['XS', 'S', 'M', 'L'],
      stock: 20,
      description: 'A midi-length crochet skirt with a flowing silhouette.',
    },
  ]);
  console.log('Seeded 5 test products across every category (placeholder images).');
}

await mongoose.disconnect();
