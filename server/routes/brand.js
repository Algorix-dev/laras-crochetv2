import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Brand from '../models/Brand.js';
import { requireAdmin, requireFullAdmin } from '../middleware/requireAdmin.js';

const router = Router();
const FIELDS = ['logoUrl', 'faviconUrl', 'primaryColor', 'instagramUrl', 'tiktokUrl', 'whatsappNumber', 'email'];

const publicShape = (b) => Object.fromEntries(FIELDS.map((f) => [f, b?.[f] || '']));

// Only http(s) links are allowed — a "javascript:" link in the footer would be an attack.
const safeUrl = (v) => {
  const s = String(v || '').trim().slice(0, 300);
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
};

// GET /api/brand  (public — the storefront reads it once when the page opens)
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(publicShape(await Brand.findById('brand')));
  } catch (err) {
    console.error('Brand load failed:', err);
    res.json(publicShape(null)); // never break the storefront over this
  }
});

// PUT /api/brand  (full admin only)
router.put('/', requireAdmin, requireFullAdmin, async (req, res) => {
  const b = req.body || {};
  const update = {};

  for (const key of ['logoUrl', 'faviconUrl', 'instagramUrl', 'tiktokUrl']) {
    if (b[key] === undefined) continue;
    const url = safeUrl(b[key]);
    if (url === null) return res.status(400).json({ error: 'One of the links is not a valid web address (it must start with https://).' });
    update[key] = url;
  }
  if (b.primaryColor !== undefined) {
    const c = String(b.primaryColor).trim();
    if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) return res.status(400).json({ error: 'The colour must look like #4a0e1e.' });
    update.primaryColor = c.toLowerCase();
  }
  if (b.whatsappNumber !== undefined) {
    const n = String(b.whatsappNumber).replace(/[^\d+]/g, '').slice(0, 20);
    if (n && n.replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'That WhatsApp number looks too short.' });
    update.whatsappNumber = n;
  }
  if (b.email !== undefined) {
    const e = String(b.email).trim().slice(0, 200);
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'That business email is not valid.' });
    update.email = e;
  }

  const doc = await Brand.findByIdAndUpdate('brand', update, { new: true, upsert: true, setDefaultsOnInsert: true });
  res.json(publicShape(doc));
});

// POST /api/brand/upload  (full admin) — one logo/favicon image → Cloudinary URL.
// Same rule as product photos: no background removal, transparency is kept.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

router.post('/upload', requireAdmin, requireFullAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That image is over 2 MB.' : 'Could not read that image.';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image file.' });
    const stream = cloudinary.uploader.upload_stream({ folder: 'laras-crochet-brand' }, (e, result) => {
      if (e) {
        console.error('Brand upload failed:', e);
        return res.status(500).json({ error: 'Upload failed. Please try again.' });
      }
      res.json({ url: result.secure_url });
    });
    stream.end(req.file.buffer);
  });
});

export default router;
