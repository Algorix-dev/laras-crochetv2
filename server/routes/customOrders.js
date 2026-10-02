import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import { sendCustomOrderNotification, sendRequestReceived } from '../utils/email.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import CustomOrderRequest from '../models/CustomOrderRequest.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n = 2000) => (typeof v === 'string' ? v.trim().slice(0, n) : undefined);

// TIP: this route is public, so limit what it accepts: max 4 photos, 10 MB
// each, images only. Without limits one person could fill Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// wraps multer so its errors become a normal JSON message
function receivePhotos(req, res, next) {
  upload.array('photos', 4)(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'One of your photos is too big. Please use photos under 10 MB.' });
    }
    return res.status(400).json({ error: 'Could not read your photos. Please try again.' });
  });
}

// GET /api/custom-orders — admin-only list for the dashboard, newest first.
router.get('/', requireAdmin, async (req, res) => {
  const requests = await CustomOrderRequest.find().sort({ createdAt: -1 });
  res.json(requests);
});

// PATCH /api/custom-orders/:id/status — mark new / contacted / closed
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  // TIP: findByIdAndUpdate skips the schema's enum check, so we check
  // against the model's own list to reject typos.
  if (!CustomOrderRequest.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Request not found' });
  }
  const doc = await CustomOrderRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Request not found' });
  res.json(doc);
});

// TIP: plain upload, no background removal — these are the customer's own
// reference photos (what they want it to look like).
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'laras-crochet-custom-orders' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/custom-orders  (public — no login required)
// multipart/form-data: photos (up to 4 files) + the fields ContactPage.jsx collects.
router.post('/', receivePhotos, async (req, res) => {
  try {
    const customerEmail = clip(req.body.customerEmail, 200)?.toLowerCase();
    if (!customerEmail || !EMAIL_RE.test(customerEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // customMeasurements arrives as a JSON string; bad JSON shouldn't crash the request
    let measurements;
    try {
      const m = req.body.customMeasurements ? JSON.parse(req.body.customMeasurements) : null;
      if (m && typeof m === 'object') {
        measurements = { size: clip(m.size, 20), bust: clip(m.bust, 20), waist: clip(m.waist, 20), hip: clip(m.hip, 20) };
      }
    } catch {
      measurements = undefined;
    }

    const photoUrls = [];
    for (const file of req.files || []) {
      const result = await uploadBufferToCloudinary(file.buffer);
      photoUrls.push(result.secure_url);
    }

    const request = await CustomOrderRequest.create({
      customerEmail,
      garmentType: clip(req.body.garmentType, 100),
      sizeChoice: clip(req.body.sizeChoice, 100),
      customMeasurements: measurements,
      colorNote: clip(req.body.colorNote, 500),
      colorSwatch: clip(req.body.colorSwatch, 20),
      otherFitDetails: clip(req.body.otherFitDetails, 1000),
      customDetails: clip(req.body.customDetails),
      photoUrls,
    });

    // Never let an email hiccup fail the customer's submission — the
    // record is already saved above regardless of what happens here.
    sendCustomOrderNotification(request).catch((err) =>
      console.error('Custom-order notification email failed:', err)
    );
    sendRequestReceived(customerEmail, 'custom').catch((err) =>
      console.error('Custom-order acknowledgement email failed:', err)
    );

    res.status(201).json({ id: request._id });
  } catch (err) {
    console.error('Custom order submission failed:', err);
    res.status(500).json({ error: 'Could not submit your request. Please try again.' });
  }
});

export default router;
