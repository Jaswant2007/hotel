import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/** Require a valid JWT. Attaches `req.user`. */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated. Please log in.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: 'Session expired or invalid. Please log in again.' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Staff-only guard — must run after `protect`. */
export function staffOnly(req, res, next) {
  if (req.user?.role !== 'staff') {
    return res.status(403).json({ message: 'Staff access required.' });
  }
  next();
}
