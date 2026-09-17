// One-off fix for the 5 test products from seedProducts.js
// (Reina, Amara, Zuri, Femi, Nneka), whose `images` arrays still
// point at raw /public/images/*.jpg files that never went through
// the real upload pipeline (routes/upload.js) — so they still have
// flat white backgrounds baked in, and Nneka only has 3 images
// instead of a proper set.
//
// This script re-runs those same local files through the exact
// same steps upload.js normally does for a live admin upload:
//   1. read the file from disk
//   2. strip its background with @imgly/background-removal-node
//   3. upload the transparent PNG to Cloudinary
//   4. overwrite that product's `images` array in Mongo with the
//      new Cloudinary URLs
//
// LOCATION: this file lives in server/, alongside index.js —
// run it from there so its .env and node_modules resolve:
//   cd server
//   node fixSeedProductImages.js

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { removeBackground } from '@imgly/background-removal-node';
import cloudinary from './config/cloudinary.js';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';

// TIP: public/images lives at the project ROOT, one level above
// this server/ folder — that's why this is '../public/images' and
// not './public/images' like it would be if this script sat in
// the root alongside seedProducts.js.
const PUBLIC_IMAGES_DIR = path.resolve('../public/images');

// TIP: mirrors seedProducts.js's image lists exactly, but you can
// freely add a 4th (or 5th) entry per product here — this script
// doesn't care how many files a product has, unlike the old
// hardcoded 3-image Nneka array.
const FIXES = {
  Reina: ['reina-teal.jpg', 'reina-turquoise-set.jpg'],
  Amara: ['reina-mustard.jpg'],
  Zuri: ['reina-burgundy.jpg'],
  Femi: ['reina-green.jpg'],
  // TIP: added reina-mustard.jpg as Nneka's 4th image just to bring
  // it up to 4 thumbnails like the other products — swap this for
  // a real 4th Nneka photo whenever Lara has one; nothing else in
  // this script needs to change to do that.
  Nneka: ['reina-lilac.jpg', 'reina-orange.jpg', 'reina-brown.jpg', 'reina-mustard.jpg'],
};

async function stripBackground(buffer, mimetype) {
  const blob = new Blob([buffer], { type: mimetype });
  const resultBlob = await removeBackground(blob);
  return Buffer.from(await resultBlob.arrayBuffer());
}

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'laras-crochet-products', format: 'png' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function processProduct(name, filenames) {
  const product = await Product.findOne({ name });
  if (!product) {
    console.log(`Skipping "${name}" — no product with that name found in DB.`);
    return;
  }

  console.log(`\n${name}: processing ${filenames.length} image(s)...`);
  const urls = [];

  for (const filename of filenames) {
    const filePath = path.join(PUBLIC_IMAGES_DIR, filename);
    let buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      console.warn(`  ! Could not read ${filePath} — skipping this file.`);
      continue;
    }

    console.log(`  - stripping background: ${filename}`);
    const cutout = await stripBackground(buffer, 'image/jpeg');

    console.log(`  - uploading to Cloudinary: ${filename}`);
    const result = await uploadBufferToCloudinary(cutout);
    urls.push(result.secure_url);
  }

  if (urls.length === 0) {
    console.warn(`  ! No images processed for "${name}" — leaving DB untouched.`);
    return;
  }

  product.images = urls;
  await product.save();
  console.log(`  ✓ ${name} updated with ${urls.length} transparent image(s).`);
}

async function main() {
  await connectDB();

  for (const [name, filenames] of Object.entries(FIXES)) {
    await processProduct(name, filenames);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});