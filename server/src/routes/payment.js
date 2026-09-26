import { Router } from 'express';
import crypto from 'crypto';
import { body } from 'express-validator';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getRazorpay, razorpayConfigured, publicKeyId } from '../utils/razorpay.js';
import { notify } from '../utils/notify.js';

const router = Router();

/** GET /api/payment/config — lets the client know if Razorpay is live or demo */
router.get('/config', (_req, res) => {
  res.json({ keyId: publicKeyId(), demo: !razorpayConfigured() });
});

/**
 * POST /api/payment/create-order
 * Creates (or re-creates) the Razorpay order for a pending app order.
 * Body: { orderId }
 */
router.post(
  '/create-order',
  protect,
  [body('orderId').isMongoId().withMessage('Invalid order id')],
  validate,
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.body.orderId);
      if (!order || String(order.user) !== String(req.user._id)) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Order already paid' });
      }
      const rzp = getRazorpay();
      if (!rzp) {
        return res.json({ demo: true, amount: Math.round(order.total * 100) });
      }
      const rzpOrder = await rzp.orders.create({
        amount: Math.round(order.total * 100),
        currency: 'INR',
        receipt: String(order._id),
        notes: { appOrder: String(order._id), user: String(req.user._id) },
      });
      order.paymentInfo = { ...order.paymentInfo, razorpayOrderId: rzpOrder.id };
      await order.save();
      res.json({ demo: false, keyId: publicKeyId(), razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/payment/verify
 * Confirms a successful Razorpay checkout via HMAC signature check.
 * In demo mode (no keys) a simulated confirmation is accepted.
 */
router.post(
  '/verify',
  protect,
  [
    body('orderId').isMongoId(),
    body('razorpay_order_id').optional().notEmpty(),
    body('razorpay_payment_id').optional().notEmpty(),
    body('razorpay_signature').optional().notEmpty(),
    body('demo').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, demo } = req.body;
      const order = await Order.findById(orderId);
      if (!order || String(order.user) !== String(req.user._id)) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.paymentStatus === 'paid') {
        return res.json({ ok: true, alreadyPaid: true, order: order.toCustomerJSON() });
      }

      if (!razorpayConfigured()) {
        // ---- Demo mode: accept simulated confirmation ----
        if (!demo && !razorpay_payment_id) {
          return res.status(400).json({ message: 'Missing payment confirmation payload' });
        }
        order.paymentStatus = 'paid';
        order.paymentInfo = {
          ...(order.paymentInfo || {}),
          razorpayOrderId: razorpay_order_id || order.paymentInfo?.razorpayOrderId || 'demo_order',
          razorpayPaymentId: razorpay_payment_id || `demo_pay_${Date.now()}`,
          razorpaySignature: 'demo',
        };
        await order.save();
        await notify({ to: req.user.email, subject: `Payment received for #${String(order._id).slice(-6)}`, body: 'Demo payment confirmed' });
        return res.json({ ok: true, demo: true, order: order.toCustomerJSON() });
      }

      // ---- Live mode: verify signature = HMAC_SHA256(order_id|payment_id, secret) ----
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing Razorpay verification fields' });
      }
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      const valid =
        expected.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
      if (!valid) {
        order.paymentStatus = 'failed';
        await order.save();
        return res.status(400).json({ message: 'Payment signature verification failed' });
      }

      order.paymentStatus = 'paid';
      order.paymentInfo = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      };
      await order.save();
      res.json({ ok: true, order: order.toCustomerJSON() });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/payment/webhook — Razorpay server-to-server callback.
 * Mounted with express.raw in index.js; signature uses RAZORPAY_WEBHOOK_SECRET.
 */
export async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    if (!secret || !signature) {
      return res.status(400).json({ message: 'Webhook secret/signature missing' });
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.body) // raw Buffer
      .digest('hex');
    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) return res.status(400).json({ message: 'Invalid webhook signature' });

    const event = JSON.parse(req.body.toString());
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity || {};
      const order =
        (await Order.findOne({ 'paymentInfo.razorpayOrderId': payment.order_id })) || null;
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentInfo = {
          ...order.paymentInfo,
          razorpayPaymentId: payment.id,
        };
        await order.save();
        console.log(`[webhook] marked order ${order._id} paid`);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook]', err.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}

export default router;
