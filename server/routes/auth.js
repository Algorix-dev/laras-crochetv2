import { Router } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

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

export default router;
