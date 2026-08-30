import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: multer normally saves uploaded files to your server's disk.
// multer-storage-cloudinary swaps that out so files go straight to
// Cloudinary instead — important, because most hosts (Render,
// Railway) wipe your server's disk on every redeploy, so saving
// images locally would silently lose them.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'laras-crochet-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
const upload = multer({ storage });

// POST /api/upload — expects multipart/form-data with an "images" field
// (Lara's admin form will send one or more files under that field name).
// Protected: only the logged-in admin can upload.
router.post('/', requireAdmin, upload.array('images', 6), (req, res) => {
  const urls = req.files.map((file) => file.path); // Cloudinary URL
  res.json({ urls });
});

export default router;
