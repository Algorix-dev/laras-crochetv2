import { Router } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';
import { requireAdmin, requireFullAdmin } from '../middleware/requireAdmin.js';
import { sendTeamInvite } from '../utils/email.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = ['admin', 'editor', 'viewer'];
const INVITE_DAYS = 7;

router.use(requireAdmin, requireFullAdmin);

const shape = (a) => ({
  id: a._id,
  name: a.name,
  email: a.email,
  accessLevel: a.accessLevel || 'admin',
  status: a.status || 'active',
  createdAt: a.createdAt,
});

const adminSiteUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// Creates a fresh invite token on the account and emails the link.
async function issueInvite(admin) {
  const token = crypto.randomBytes(32).toString('hex');
  admin.inviteTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  admin.inviteExpiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
  await admin.save();
  const link = `${adminSiteUrl()}/admin?invite=${token}`;
  await sendTeamInvite(admin.email, admin.accessLevel, link, INVITE_DAYS);
}

// GET /api/team
router.get('/', async (req, res) => {
  const people = await AdminUser.find().sort({ createdAt: 1 });
  res.json(people.map(shape));
});

// POST /api/team   body: { email, accessLevel }  — sends the invite email
router.post('/', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const accessLevel = req.body?.accessLevel;
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!LEVELS.includes(accessLevel)) return res.status(400).json({ error: 'Choose a role.' });
    if (await AdminUser.findOne({ email })) {
      return res.status(400).json({ error: 'That email is already in the team.' });
    }
    const admin = await AdminUser.create({
      email,
      name: email.split('@')[0],
      accessLevel,
      status: 'invited',
    });
    try {
      await issueInvite(admin);
    } catch (err) {
      // No point keeping an invitation nobody received.
      await AdminUser.findByIdAndDelete(admin._id);
      console.error('Team invite email failed:', err);
      return res.status(502).json({ error: 'Could not send the invite email. Please try again.' });
    }
    res.status(201).json(shape(admin));
  } catch (err) {
    console.error('Team invite failed:', err);
    res.status(500).json({ error: 'Could not send the invite.' });
  }
});

// POST /api/team/:id/resend — a fresh link for someone still "invited"
router.post('/:id/resend', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const admin = await AdminUser.findById(req.params.id);
  if (!admin || admin.status !== 'invited') return res.status(404).json({ error: 'No pending invite for that person.' });
  try {
    await issueInvite(admin);
    res.json({ ok: true });
  } catch (err) {
    console.error('Resend invite failed:', err);
    res.status(502).json({ error: 'Could not send the invite email. Please try again.' });
  }
});

// Counting admins protects against locking everyone out.
const activeAdminCount = () => AdminUser.countDocuments({ status: { $ne: 'invited' }, $or: [{ accessLevel: 'admin' }, { accessLevel: { $exists: false } }] });

// PATCH /api/team/:id   body: { accessLevel }
router.patch('/:id', async (req, res) => {
  const { accessLevel } = req.body || {};
  if (!LEVELS.includes(accessLevel)) return res.status(400).json({ error: 'Choose a role.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  if (String(req.params.id) === String(req.adminId)) {
    return res.status(400).json({ error: "You can't change your own role." });
  }
  const person = await AdminUser.findById(req.params.id);
  if (!person) return res.status(404).json({ error: 'Not found' });
  if ((person.accessLevel || 'admin') === 'admin' && accessLevel !== 'admin' && (await activeAdminCount()) <= 1) {
    return res.status(400).json({ error: 'You need at least one admin.' });
  }
  person.accessLevel = accessLevel;
  await person.save();
  res.json(shape(person));
});

// DELETE /api/team/:id — removes access immediately (requireAdmin re-checks the database on every request)
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  if (String(req.params.id) === String(req.adminId)) {
    return res.status(400).json({ error: "You can't remove your own account." });
  }
  const person = await AdminUser.findById(req.params.id);
  if (!person) return res.status(404).json({ error: 'Not found' });
  if ((person.accessLevel || 'admin') === 'admin' && person.status !== 'invited' && (await activeAdminCount()) <= 1) {
    return res.status(400).json({ error: 'You need at least one admin.' });
  }
  await person.deleteOne();
  res.json({ ok: true });
});

export default router;
