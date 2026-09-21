import { Router } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// POST /api/auth/login
// TIP: this is the ONLY unprotected admin route — everything else
// under /api/admin/* requires the token this route hands back.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email });
  if (!admin) {
    // TIP: deliberately vague — "invalid credentials" either way,
    // rather than "no account found" — so an attacker can't use
    // this endpoint to figure out which emails have admin accounts.
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, name: admin.name, email: admin.email });
});

// PUT /api/auth/password — the admin changes their own password.
// Body: { currentPassword, newPassword }. The current password must be right
// (so a stolen, still-valid login token alone can't lock Lara out).
router.put('/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Enter your current and new password' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'The new password needs at least 8 characters' });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'The new password must be different from the current one' });
  }

  const admin = await AdminUser.findById(req.adminId);
  if (!admin) return res.status(401).json({ error: 'Invalid or expired token' });

  if (!(await admin.comparePassword(currentPassword))) {
    return res.status(400).json({ error: 'Your current password is not right' });
  }

  // the pre-save hook in AdminUser.js hashes it
  admin.password = newPassword;
  await admin.save();
  res.json({ ok: true });
});

// PUT /api/auth/profile — the admin's display name (shown in the dashboard).
// Email is left alone on purpose: it is the login.
router.put('/profile', requireAdmin, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'Enter a name' });

  const admin = await AdminUser.findByIdAndUpdate(req.adminId, { name }, { new: true });
  if (!admin) return res.status(401).json({ error: 'Invalid or expired token' });
  res.json({ name: admin.name, email: admin.email });
});

export default router;
