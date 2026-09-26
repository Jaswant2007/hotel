import User from '../models/User.js';
import Order from '../models/Order.js';

/** Public sign-in helper — signs a 7-day JWT for the user. */
export function signToken(user, jwt) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Fetch profile with a friendly shape (addresses + defaults). */
export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  return user.toJSON();
}

export { User, Order };
