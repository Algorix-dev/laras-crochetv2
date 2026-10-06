import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

// TIP: NO background removal any more. Lara uploads photos that already have a
// transparent background, so the server's only job is to shrink them and keep
// that transparency. (The old AI step is gone — that's also why the server no
// longer needs the big @imgly package or lots of memory.)
//
// The one thing that MUST be handled: JPEG cannot store transparency. So a
// photo that has see-through pixels is saved as WebP (it keeps transparency but is
// roughly 10x smaller than PNG, which keeps the shop fast); a normal photo with no
// transparency is saved as a smaller JPEG.
sharp.concurrency(1);
sharp.cache(false);

// TIP: .rotate() with no arguments reads the photo's EXIF orientation and
// turns it upright (phone photos often look sideways without it).
// To change the maximum size, edit the 1600 (pixels wide). To trade sharpness for
// speed on see-through photos, change quality: 82 (lower = smaller file, softer photo).
async function prepareImage(file) {
  const img = sharp(file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true });
  const { hasAlpha } = await sharp(file.buffer).metadata();
  if (hasAlpha) {
    return { buffer: await img.webp({ quality: 82, alphaQuality: 100 }).toBuffer(), format: 'webp' };
  }
  return { buffer: await img.jpeg({ quality: 85 }).toBuffer(), format: 'jpg' };
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

// TIP — BACKGROUND COLOUR OF A PHOTO. We shrink the photo to a tiny 24x24 picture (this takes
// a few milliseconds and is thrown away) and average its outer ring of pixels. If the photo has
// see-through parts we return '' because then the card's own background shows through anyway.
// The result is saved with the product so the browser never has to measure anything.
async function edgeColour(buffer) {
  try {
    const { hasAlpha } = await sharp(buffer).metadata();
    if (hasAlpha) return '';
    const N = 24;
    const { data } = await sharp(buffer).rotate().resize(N, N, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (x > 1 && x < N - 2 && y > 1 && y < N - 2) continue; // only the outer ring
        const i = (y * N + x) * 3;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
    }
    const hex = (v) => Math.round(v / count).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return '';
  }
}

router.post('/', requireAdmin, receiveImages, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No photo was sent.' });

    const urls = [];
    const bgs = [];
    for (const file of req.files) {
      let prepared;
      try {
        prepared = await prepareImage(file);
      } catch (err) {
        console.error('Image could not be processed:', err);
        return res.status(400).json({ error: "That file doesn't look like a valid image." });
      }
      const result = await uploadBufferToCloudinary(prepared.buffer, prepared.format);
      urls.push(result.secure_url);
      bgs.push(await edgeColour(file.buffer));
    }
    res.json({ urls, bgs });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to process one or more images.' });
  }
});

export default router;
