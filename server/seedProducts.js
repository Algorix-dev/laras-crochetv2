// Run once with: node seedProducts.js
// Adds test products to your live database so the frontend has
// something real to fetch once it's wired to the API.
//
// TIP: image URLs below are placeholders, NOT the real Reina photos —
// those live locally in src/assets and were never uploaded to
// Cloudinary. Once the admin panel exists (or you upload manually
// via POST /api/upload), replace these with real Cloudinary URLs.
// This script exists purely to test that "product in database" →
// "product shows on site" actually works end to end.
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
  ]);
  console.log('Seeded 1 test product (Reina, placeholder image).');
}

await mongoose.disconnect();
