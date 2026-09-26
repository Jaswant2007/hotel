import { Router } from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

/** All cart routes are authenticated — carts live on the user document. */
router.use(protect);

async function hydratedCart(userId) {
  const user = await User.findById(userId).populate('cart.menuItem');
  const items = (user.cart || [])
    .filter((c) => c.menuItem && c.menuItem.available)
    .map((c) => ({
      menuItem: c.menuItem.toObject(),
      qty: c.qty,
    }));
  const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.qty, 0);
  return { items, subtotal };
}

/** GET /api/cart */
router.get('/', async (req, res, next) => {
  try {
    res.json(await hydratedCart(req.user._id));
  } catch (err) {
    next(err);
  }
});

/** PUT /api/cart — replace the whole cart (used by client-side sync) */
router.put(
  '/',
  [
    body('items').isArray({ max: 60 }).withMessage('items must be an array'),
    body('items.*.menuItem').isMongoId().withMessage('Invalid menu item id'),
    body('items.*.qty').isInt({ min: 1, max: 50 }).withMessage('qty must be 1–50'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const ids = req.body.items.map((i) => i.menuItem);
      const valid = await MenuItem.find({ _id: { $in: ids }, available: true }).select('_id');
      const validIds = new Set(valid.map((v) => String(v._id)));

      const cart = req.body.items
        .filter((i) => validIds.has(String(i.menuItem)))
        .map((i) => ({ menuItem: i.menuItem, qty: i.qty }));

      await User.findByIdAndUpdate(req.user._id, { cart });
      res.json(await hydratedCart(req.user._id));
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/cart — clear */
router.delete('/', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json({ items: [], subtotal: 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
