import { Router } from 'express';
import multer from 'multer';
import { removeBackground } from '@imgly/background-removal-node';
import cloudinary from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import sharp from 'sharp'; // already in your package.json

const SKIP_AI_ABOVE_BYTES = 12 * 1024 * 1024; // ~12MB raw — too risky to run the model on

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// TIP: background removal is now best-effort per file. If it throws OR
// takes longer than STRIP_TIMEOUT_MS (slow/cold model, low memory, etc.),
// we fall back to the ORIGINAL image instead of failing the whole upload —
// a product photo that still has its background is a much smaller problem
// than the admin being unable to add products before launch.
const STRIP_TIMEOUT_MS = 15000;

async function stripBackground(buffer, mimetype) {
  // Downscale first — memory use scales with pixel count, and product
  // photos don't need to be huge before Cloudinary stores them.
  const resized = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).toBuffer();

  if (buffer.length > SKIP_AI_ABOVE_BYTES) {
    console.warn('Skipping background removal — file too large to risk it:', buffer.length);
    return resized;
  }

  const blob = new Blob([resized], { type: mimetype });
  const resultBlob = await removeBackground(blob);
  return Buffer.from(await resultBlob.arrayBuffer());
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('stripBackground timed out')), ms)),
  ]);
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

router.post('/', requireAdmin, upload.array('images', 6), async (req, res) => {
  try {
    // TIP: sequential, not Promise.all — running the model on several
    // images AT ONCE multiplies peak memory, which is almost certainly
    // what was killing the process (a 502 with no JSON body means the
    // process itself died/hung, not that our own catch block ran).
    const urls = [];
    for (const file of req.files) {
      let bufferToUpload = file.buffer;
      try {
        bufferToUpload = await withTimeout(
          stripBackground(file.buffer, file.mimetype),
          STRIP_TIMEOUT_MS
        );
      } catch (stripErr) {
        console.error('Background removal failed, uploading original image instead:', stripErr);
      }
      const result = await uploadBufferToCloudinary(bufferToUpload);
      urls.push(result.secure_url);
    }
    res.json({ urls });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to process one or more images.' });
  }
});

export default router;