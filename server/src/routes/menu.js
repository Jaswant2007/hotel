import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import { protect, staffOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { body, param } from 'express-validator';

const router = Router();

/**
 * GET /api/menu?category=morning|afternoon|dinner
 * Returns the menu grouped by category when no filter is given.
 */
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { available: true };
    if (category) {
      if (!['morning', 'afternoon', 'dinner'].includes(category)) {
        return res.status(400).json({ message: 'category must be morning|afternoon|dinner' });
      }
      filter.category = category;
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

/** GET /api/menu/popular — home page highlights */
router.get('/popular', async (_req, res, next) => {
  try {
    const items = await MenuItem.find({ available: true, isPopular: true }).limit(6);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const createRules = [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }).withMessage('price must be >= 0'),
  body('category').isIn(['morning', 'afternoon', 'dinner']),
  body('isVeg').isBoolean(),
];

/** POST /api/menu — staff: add an item */
router.post('/', protect, staffOnly, createRules, validate, async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/menu/:id — staff: update availability/price/etc */
router.patch(
  '/:id',
  protect,
  staffOnly,
  param('id').isMongoId().withMessage('Invalid menu item id'),
  validate,
  async (req, res, next) => {
    try {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) return res.status(404).json({ message: 'Menu item not found' });
      res.json({ item });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
