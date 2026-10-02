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
// photo that has see-through pixels is saved as PNG; a normal photo with no
// transparency is saved as a smaller JPEG.
sharp.concurrency(1);
sharp.cache(false);

// TIP: .rotate() with no arguments reads the photo's EXIF orientation and
// turns it upright (phone photos often look sideways without it).
// To change the maximum size, edit the 1600 (pixels wide).
async function prepareImage(file) {
  const img = sharp(file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true });
  const { hasAlpha } = await sharp(file.buffer).metadata();
  if (hasAlpha) {
    return { buffer: await img.png({ compressionLevel: 9 }).toBuffer(), format: 'png' };
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

router.post('/', requireAdmin, receiveImages, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No photo was sent.' });

    const urls = [];
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
    }
    res.json({ urls });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to process one or more images.' });
  }
});

export default router;
