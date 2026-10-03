import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

// TIP: the old version only asked "did WE sign this token?". Customers get
// tokens signed by us too, so a customer token passed as admin. Now we also
// require role === 'admin' AND that the id still exists in AdminUser
// (so deleting an admin instantly locks them out).
//
// ACCESS LEVELS (see models/AdminUser.js): after the login check we also
// look at the person's level. A "viewer" may only read (GET); anything that
// changes data answers 403. Routes that only a full admin may use (team,
// shipping prices, brand, newsletters) add requireFullAdmin after this.
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

    const admin = await AdminUser.findById(decoded.id).select('_id accessLevel status');
    if (!admin || admin.status === 'invited') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.adminId = admin._id;
    req.adminLevel = admin.accessLevel || 'admin';

    if (req.adminLevel === 'viewer' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({ error: 'Your account is view-only, so you cannot make changes.' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Use AFTER requireAdmin on routes only a full admin may use.
export function requireFullAdmin(req, res, next) {
  if (req.adminLevel !== 'admin') {
    return res.status(403).json({ error: 'Only an admin can do this.' });
  }
  next();
}
