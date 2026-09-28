import { Router } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // TIP: insist on strings. Without this, someone can send a Mongo query
    // object as the email, or a non-string password that makes bcrypt throw.
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Enter your email and password' });
    }

    const admin = await AdminUser.findOne({ email: email.trim() });

    // TIP: deliberately vague, "Invalid credentials" either way, so an
    // attacker can't learn which emails have admin accounts.
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // TIP: role: 'admin' is what requireAdmin now checks for.
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, name: admin.name, email: admin.email });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Something went wrong, try again' });
  }
});

// PUT /api/auth/password — the admin changes their own password.
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

// PUT /api/auth/profile — the admin's display name.
router.put('/profile', requireAdmin, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'Enter a name' });

  const admin = await AdminUser.findByIdAndUpdate(req.adminId, { name }, { new: true });
  if (!admin) return res.status(401).json({ error: 'Invalid or expired token' });
  res.json({ name: admin.name, email: admin.email });
});

export default router;