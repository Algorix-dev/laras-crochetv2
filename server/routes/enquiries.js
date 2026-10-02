import { Router } from 'express';
import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { sendEnquiryNotification, sendRequestReceived } from '../utils/email.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n = 2000) => (typeof v === 'string' ? v.trim().slice(0, n) : undefined);

// POST /api/enquiries   (public — the enquiry side of the Contact page)
router.post('/', async (req, res) => {
  try {
    const email = clip(req.body?.customerEmail, 200)?.toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const m = req.body?.sizingMeasurements || {};
    const enquiry = await Enquiry.create({
      customerEmail: email,
      topic: clip(req.body?.topic, 100) || 'Something else',
      itemName: clip(req.body?.itemName, 200),
      orderRef: clip(req.body?.orderRef, 100),
      message: clip(req.body?.message),
      sizingMeasurements: {
        size: clip(m.size, 20),
        bust: clip(m.bust, 20),
        waist: clip(m.waist, 20),
        hip: clip(m.hip, 20),
      },
    });

    // Saved already — emails are best-effort and must never fail the request.
    sendEnquiryNotification(enquiry).catch((e) => console.error('Enquiry notify failed:', e));
    sendRequestReceived(email, 'enquiry').catch((e) => console.error('Enquiry ack failed:', e));

    res.status(201).json({ id: enquiry._id });
  } catch (err) {
    console.error('Enquiry submission failed:', err);
    res.status(500).json({ error: 'Could not send your message. Please try again.' });
  }
});

// GET /api/enquiries — admin list, newest first
router.get('/', requireAdmin, async (req, res) => {
  res.json(await Enquiry.find().sort({ createdAt: -1 }));
});

// PATCH /api/enquiries/:id/status — new / replied / closed
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!Enquiry.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  const doc = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Enquiry not found' });
  res.json(doc);
});

export default router;
