import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// TIP: mirrors requireAdmin.js almost exactly, but looks up a User
// instead of an AdminUser. Keeping them as two separate middleware
// functions (rather than one "requireAuth" that branches on role)
// keeps admin routes and customer routes cleanly separate.
export async function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.customerId = user._id;
    req.customerEmail = user.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
