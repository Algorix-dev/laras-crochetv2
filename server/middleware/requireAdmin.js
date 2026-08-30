import jwt from 'jsonwebtoken';

// TIP: this is "middleware" — a function that sits between the
// incoming request and your route handler. Express runs it first;
// if it calls next(), the request continues to the actual route.
// If it doesn't, the request stops here. This is how you protect
// routes without repeating the same auth check in every one.
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization; // expected: "Bearer <token>"
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id; // route handlers can now read req.adminId
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
