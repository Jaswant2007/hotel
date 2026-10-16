import crypto from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10-digit Indian mobile number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('address.pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Valid 6-digit pincode required'),
  body('address.line1').trim().notEmpty().withMessage('Delivery address is required'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

function tokenFor(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** POST /api/auth/register — create account (isFirstOrder: true by default) */
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({
      name,
      email,
      phone,
      password,
      isFirstOrder: true,
      addresses: [
        {
          label: 'Home',
          line1: address.line1,
          area: address.area || '',
          city: address.city || 'Chennai',
          pincode: address.pincode,
          phone,
          isDefault: true,
        },
      ],
    });

    res.status(201).json({ token: tokenFor(user), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/login */
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: tokenFor(user), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/supabase-sync — bridge Supabase authenticated user into Hotel database */
router.post('/supabase-sync', async (req, res, next) => {
  try {
    const { email, phone, name, address } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone required from Supabase session' });
    }

    // Look up by email or phone
    const queries = [];
    if (email) queries.push({ email: email.toLowerCase().trim() });
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone) queries.push({ phone: cleanPhone });
    }

    let user = null;
    if (queries.length > 0) {
      user = await User.findOne({ $or: queries });
    }

    if (!user) {
      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '9876543210';
      const cleanEmail = email ? email.toLowerCase().trim() : `guest_${cleanPhone}@hotelsrivar.com`;
      const displayName = name || (email ? email.split('@')[0] : `Guest ${cleanPhone.slice(-4)}`);
      const dummyPassword = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        name: displayName,
        email: cleanEmail,
        phone: cleanPhone,
        password: dummyPassword,
        isFirstOrder: true,
        addresses: address?.line1
          ? [
              {
                label: 'Home',
                line1: address.line1,
                area: address.area || '',
                city: address.city || 'Chennai',
                pincode: address.pincode || '600004',
                phone: cleanPhone,
                isDefault: true,
              },
            ]
          : [],
      });
    }

    res.json({ token: tokenFor(user), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me — current session */
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

export default router;

