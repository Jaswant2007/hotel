import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, staffOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrder, listOrders, getOrder, updateOrderStatus } from '../controllers/ordersController.js';

const router = Router();

router.use(protect);

const createRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.menuItem').isMongoId().withMessage('Invalid menu item id'),
  body('items.*.qty').isInt({ min: 1, max: 50 }).withMessage('qty must be 1–50'),
  body('paymentMethod').optional().isIn(['razorpay', 'cod']),
  body('isPickup').optional().isBoolean(),
];

/** POST /api/orders — place a new order */
router.post('/', createRules, validate, createOrder);

/** GET /api/orders — my orders (or ?scope=staff&status=... for staff) */
router.get('/', listOrders);

/** PATCH /api/orders/:id/status — staff status updates */
router.patch(
  '/:id/status',
  staffOnly,
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status').isIn(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']),
  validate,
  updateOrderStatus
);

/** GET /api/orders/:id — tracking */
router.get('/:id', param('id').isMongoId(), validate, getOrder);

export default router;
