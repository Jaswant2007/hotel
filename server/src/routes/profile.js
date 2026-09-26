import { Router } from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

/** GET /api/profile */
router.get('/', (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/** PATCH /api/profile — edit name / phone / email */
router.patch(
  '/',
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
    body('phone')
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Valid 10-digit mobile number required'),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const updates = {};
      for (const key of ['name', 'phone', 'email']) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.email && updates.email !== req.user.email) {
        const clash = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
        if (clash) return res.status(409).json({ message: 'That email is already in use' });
      }
      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });
      res.json({ user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/profile/password */
router.patch(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/profile/addresses */
router.post(
  '/addresses',
  [
    body('line1').trim().notEmpty().withMessage('Address line is required'),
    body('pincode').matches(/^[1-9][0-9]{5}$/).withMessage('Valid pincode required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      const makeDefault = req.body.isDefault || user.addresses.length === 0;
      if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
      user.addresses.push({ ...req.body, isDefault: makeDefault });
      await user.save();
      res.status(201).json({ user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/profile/addresses/:addressId — edit / set default */
router.patch(
  '/addresses/:addressId',
  body('pincode').optional().matches(/^[1-9][0-9]{5}$/),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      const addr = user.addresses.id(req.params.addressId);
      if (!addr) return res.status(404).json({ message: 'Address not found' });
      if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
      Object.assign(addr, req.body);
      await user.save();
      res.json({ user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/profile/addresses/:addressId */
router.delete('/addresses/:addressId', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

export default router;
