import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

// TIP: the old version only asked "did WE sign this token?". Customers get
// tokens signed by us too, so a customer token passed as admin. Now we also
// require role === 'admin' AND that the id still exists in AdminUser
// (so deleting an admin instantly locks them out).
export async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // TIP: 401 (not 403) on purpose, because the admin screen signs Lara
    // out when it sees a 401.
    if (decoded.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const admin = await AdminUser.findById(decoded.id).select('_id');
    if (!admin) return res.status(401).json({ error: 'Invalid or expired token' });

    req.adminId = admin._id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}