import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import CustomOrderRequest from '../models/CustomOrderRequest.js';
import { sendCustomOrderNotification } from '../utils/email.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
