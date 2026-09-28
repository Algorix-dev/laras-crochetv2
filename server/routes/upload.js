import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

// TIP: the background-removal library is NOT imported at the top any more.
// A top-level import loads its native code at server start, and that code
// collides with sharp's own copy (the cause of the segfault in your logs).
// getRemoveBackground() below loads it only the first time it's needed.
// With SKIP_BACKGROUND_REMOVAL=true it is never loaded at all.
const SKIP_BG_REMOVAL = process.env.SKIP_BACKGROUND_REMOVAL === 'true';
const SKIP_AI_ABOVE_BYTES = 12 * 1024 * 1024; // raw file bigger than this skips the AI step
const STRIP_TIMEOUT_MS = 15000;

// TIP: one image at a time, and don't keep decoded images cached in memory.
// Both help a small host (Render's free plan has 512 MB) stay under its limit.
sharp.concurrency(1);
sharp.cache(false);

let removeBackgroundFn = null;
async function getRemoveBackground() {
  if (!removeBackgroundFn) {
    const mod = await import('@imgly/background-removal-node');
    removeBackgroundFn = mod.removeBackground;
  }
  return removeBackgroundFn;
}

// TIP: .rotate() with no arguments reads the photo's EXIF orientation and
// turns it upright (phone photos often look sideways without it).
// To change the maximum size, edit the 1600 (pixels wide).
async function resizeImage(buffer) {
  return sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true });
}

// Returns { buffer, format } ready for Cloudinary.
async function prepareImage(file) {
  const base = await resizeImage(file.buffer);

  // No background removal: keep the photo as a smaller JPEG.
  if (SKIP_BG_REMOVAL || file.buffer.length > SKIP_AI_ABOVE_BYTES) {
    return { buffer: await base.jpeg({ quality: 85 }).toBuffer(), format: 'jpg' };
  }

  // Background removal needs a PNG so the see-through background survives.
  const resized = await base.png().toBuffer();
  const removeBackground = await getRemoveBackground();
  const blob = new Blob([resized], { type: 'image/png' });
  const resultBlob = await removeBackground(blob);
  return { buffer: Buffer.from(await resultBlob.arrayBuffer()), format: 'png' };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('background removal timed out')), ms)),
  ]);
}

function uploadBufferToCloudinary(buffer, format) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'laras-crochet-products', format },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

const router = Router();

// TIP: limits stop one huge upload from using up the server's memory.
// fileSize is in bytes (20 MB here); files is how many photos per request.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 6 },
});

// TIP: wrapping multer lets us turn its errors (file too big, too many
// files) into a normal JSON message instead of a confusing crash.
function receiveImages(req, res, next) {
  upload.array('images', 6)(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'That photo is too big. Please use one under 20 MB.' });
    }
    return res.status(400).json({ error: 'Could not read the upload. Try again.' });
  });
}

router.post('/', requireAdmin, receiveImages, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No photo was sent.' });

    const urls = [];
    for (const file of req.files) {
      let prepared;
      try {
        prepared = await withTimeout(prepareImage(file), STRIP_TIMEOUT_MS);
      } catch (err) {
        // TIP: if resizing or background removal fails, fall back to the
        // plain resized JPEG so the upload still works.
        console.error('Image processing failed, using a plain resize instead:', err);
        const fallback = await (await resizeImage(file.buffer)).jpeg({ quality: 85 }).toBuffer();
        prepared = { buffer: fallback, format: 'jpg' };
      }
      const result = await uploadBufferToCloudinary(prepared.buffer, prepared.format);
      urls.push(result.secure_url);
    }
    res.json({ urls });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to process one or more images.' });
  }
});

export default router;