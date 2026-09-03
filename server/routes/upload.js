import { Router } from 'express';
import multer from 'multer';
import { removeBackground } from '@imgly/background-removal-node';
import cloudinary from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: switched from multer-storage-cloudinary (which streamed the
// file straight to Cloudinary with no chance to touch it first) to
// memoryStorage, so every product photo passes through
// removeBackground() below BEFORE it ever reaches Cloudinary. This is
// what makes "no background, just the page color showing through"
// automatic for Lara — she uploads whatever photo she has, the
// background is stripped server-side, and only the transparent PNG
// is what gets stored.
const upload = multer({ storage: multer.memoryStorage() });

// TIP: @imgly/background-removal-node runs a local ONNX segmentation
// model on the server — no third-party API, no per-image cost, no
// remove.bg account/API key. It's slower than a paid API (a couple
// seconds per image) and the very first call downloads its model
// weights, so the FIRST upload after a fresh deploy will be visibly
// slower than the rest — that's expected, not a bug.
async function stripBackground(buffer, mimetype) {
  const blob = new Blob([buffer], { type: mimetype });
  const resultBlob = await removeBackground(blob);
  return Buffer.from(await resultBlob.arrayBuffer());
}

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'laras-crochet-products',
        // TIP: force PNG so the transparent background survives —
        // if this stayed jpg/webp-without-alpha the cutout would get
        // flattened onto a solid color again on the way out.
        format: 'png',
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/upload — expects multipart/form-data with an "images" field
// (Lara's admin form will send one or more files under that field name).
// Protected: only the logged-in admin can upload.
router.post('/', requireAdmin, upload.array('images', 6), async (req, res) => {
  try {
    const urls = await Promise.all(
      req.files.map(async (file) => {
        const cutout = await stripBackground(file.buffer, file.mimetype);
        const result = await uploadBufferToCloudinary(cutout);
        return result.secure_url;
      })
    );
    res.json({ urls });
  } catch (err) {
    console.error('Upload/background-removal failed:', err);
    res.status(500).json({ error: 'Failed to process one or more images.' });
  }
});

export default router;
