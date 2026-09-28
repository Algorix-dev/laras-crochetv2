import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { sendCustomOrderNotification } from '../utils/email.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import CustomOrderRequest from '../models/CustomOrderRequest.js';
import mongoose from 'mongoose';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/custom-orders — admin-only list for the dashboard.
// TIP: the customer-facing POST route stays open; only this one is locked.
router.get('/', requireAdmin, async (req, res) => {
  const requests = await CustomOrderRequest.find().sort({ createdAt: -1 });
  res.json(requests);
});

// GET /api/custom-orders — admin-only list, newest first
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
// TIP: plain upload, no @imgly background removal — these are the
// customer's own reference photos (what they want it to look like),
// not a product photo that needs a clean background for the shop.
// That also means this route can't hit the memory problem the
// product-upload route had.
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'laras-crochet-custom-orders' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/custom-orders  (public — no login required, same as the
// contact form itself)
// multipart/form-data: photos (up to 4 files) + the same field names
// ContactPage.jsx already collects in its "custom" formData.
router.post('/', upload.array('photos', 4), async (req, res) => {
  try {
    const {
      customerEmail,
      garmentType,
      sizeChoice,
      colorNote,
      customDetails,
      // customMeasurements is sent as a JSON string in the form body
      customMeasurements,
    } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const photoUrls = [];
    for (const file of req.files || []) {
      const result = await uploadBufferToCloudinary(file.buffer);
      photoUrls.push(result.secure_url);
    }

    const request = await CustomOrderRequest.create({
      customerEmail,
      garmentType,
      sizeChoice,
      customMeasurements: customMeasurements ? JSON.parse(customMeasurements) : undefined,
      colorNote,
      customDetails,
      photoUrls,
    });

    // Never let an email hiccup fail the customer's submission — the
    // record is already saved above regardless of what happens here.
    sendCustomOrderNotification(request).catch((err) =>
      console.error('Custom-order notification email failed:', err)
    );

    res.status(201).json({ id: request._id });
  } catch (err) {
    console.error('Custom order submission failed:', err);
    res.status(500).json({ error: 'Could not submit your request. Please try again.' });
  }
});

export default router;
