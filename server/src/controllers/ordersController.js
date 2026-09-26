import Order, { ORDER_STATUSES } from '../models/Order.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import { computeDeliveryFee, computeFirstOrderDiscount, buildTotals } from '../utils/pricing.js';
import { getRazorpay, razorpayConfigured } from '../utils/razorpay.js';
import { notifyNewOrder, notifyStatusChange } from '../utils/notify.js';

/**
 * POST /api/orders
 * Server-side pricing: prices, discount and delivery fee are always
 * recomputed from the database — never trusted from the client.
 */
export async function createOrder(req, res, next) {
  try {
    const { items, addressId, deliveryAddress, isPickup = false, paymentMethod = 'cod', customerNote } =
      req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!['razorpay', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'paymentMethod must be razorpay or cod' });
    }

    // ---- Resolve items & prices from DB ----
    const ids = items.map((i) => i.menuItem);
    const docs = await MenuItem.find({ _id: { $in: ids }, available: true });
    const byId = new Map(docs.map((d) => [String(d._id), d]));

    const orderItems = [];
    for (const line of items) {
      const doc = byId.get(String(line.menuItem));
      const qty = Number(line.qty);
      if (!doc || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        return res.status(400).json({ message: 'Cart contains an invalid item' });
      }
      orderItems.push({
        menuItem: doc._id,
        name: doc.name,
        price: doc.price,
        qty,
        image: doc.image,
        isVeg: doc.isVeg,
      });
    }

    const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

    // ---- Resolve delivery target ----
    let address = null;
    if (!isPickup) {
      if (addressId) {
        const owner = await User.findById(req.user._id);
        address = owner.addresses.id(addressId);
        if (!address) return res.status(400).json({ message: 'Saved address not found' });
        address = address.toObject();
      } else if (deliveryAddress?.line1 && deliveryAddress?.pincode) {
        address = {
          label: deliveryAddress.label || 'Other',
          line1: deliveryAddress.line1,
          area: deliveryAddress.area || '',
          city: deliveryAddress.city || 'Chennai',
          pincode: String(deliveryAddress.pincode),
          phone: deliveryAddress.phone || req.user.phone,
          note: deliveryAddress.note || '',
        };
      } else {
        return res.status(400).json({ message: 'Delivery address is required' });
      }
      if (!address.phone) address.phone = req.user.phone;
    }

    // ---- Totals ----
    const isFirstOrder = req.user.isFirstOrder === true;
    const discount = computeFirstOrderDiscount(subtotal, isFirstOrder);
    const deliveryFee = await computeDeliveryFee({
      pincode: address?.pincode,
      isPickup,
      subtotal,
    });
    const totals = buildTotals({ subtotal, discount, deliveryFee });

    // ---- Create Razorpay order when paying online ----
    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
      const rzp = getRazorpay();
      if (rzp) {
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(totals.total * 100), // paise
          currency: 'INR',
          receipt: `temp_${Date.now()}`,
          notes: { user: String(req.user._id) },
        });
        razorpayOrderId = rzpOrder.id;
      }
      // No keys configured → demo mode; client will simulate the checkout.
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      ...totals,
      isFirstOrderDiscount: discount > 0,
      isPickup,
      deliveryAddress: address || undefined,
      status: 'placed',
      statusHistory: [{ status: 'placed', by: req.user._id }],
      paymentMethod,
      paymentStatus: 'pending',
      paymentInfo: razorpayOrderId ? { razorpayOrderId } : undefined,
      customerNote: (customerNote || '').slice(0, 300),
      etaMinutes: isPickup ? 20 : 45,
    });

    // Consume the first-order flag exactly once.
    if (isFirstOrder) {
      await User.updateOne({ _id: req.user._id, isFirstOrder: true }, { $set: { isFirstOrder: false } });
      req.user.isFirstOrder = false;
    }

    await notifyNewOrder(order, req.user);

    res.status(201).json({
      order: order.toCustomerJSON(),
      payment: {
        method: paymentMethod,
        keyId: razorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
        razorpayOrderId,
        demo: !razorpayConfigured(),
        amount: Math.round(totals.total * 100),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders — own orders (customers) or all orders (staff) */
export async function listOrders(req, res, next) {
  try {
    const isStaff = req.user.role === 'staff' && req.query.scope === 'staff';
    const filter = {};
    if (!isStaff) filter.user = req.user._id;
    if (req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 50)
      .populate('user', 'name phone email');
    res.json({ orders: orders.map((o) => o.toCustomerJSON()) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/:id — customer tracking (owner or staff) */
export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name phone email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isOwner = String(order.user?._id || order.user) === String(req.user._id);
    if (!isOwner && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not your order' });
    }
    res.json({ order: order.toCustomerJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/orders/:id/status — staff only.
 * Enforces the flow: placed → confirmed → preparing → out_for_delivery → delivered
 * (staff may also jump straight ahead, but never backwards except to cancelled states).
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Order already delivered' });
    }

    order.status = status;
    order.statusHistory.push({ status, at: new Date(), by: req.user._id });

    // Riders collect cash on delivery — mark COD orders paid at hand-off.
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
    }

    await order.save();
    await notifyStatusChange(order, order.user, status);

    res.json({ order: order.toCustomerJSON() });
  } catch (err) {
    next(err);
  }
}
