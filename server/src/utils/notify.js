/**
 * Notification hook — currently logs to the server console.
 *
 * To go live with email/SMS, plug in a provider here, e.g.:
 *   - SMTP (nodemailer) → order confirmations to the customer
 *   - MSG91 / Twilio   → SMS to hotel staff on every new order
 * The rest of the app only calls `notify()`, so swapping transports
 * requires no changes elsewhere.
 */
export function notify({ to, subject, body, meta = {} }) {
  const line = `[notify] ${subject} → ${to}: ${body}`;
  if (process.env.NODE_ENV !== 'test') console.log(line, meta);
  // TODO: integrate email/SMS provider here.
  return Promise.resolve({ delivered: false, reason: 'hook-not-configured' });
}

export function notifyNewOrder(order, customer) {
  return notify({
    to: customer?.email || order.user,
    subject: `Order #${String(order._id).slice(-6)} received`,
    body: `Thanks ${customer?.name || ''}! We've received your order (₹${order.total}). ETA ${order.etaMinutes} min.`,
    meta: { orderId: order._id },
  });
}

export function notifyStatusChange(order, customer, status) {
  return notify({
    to: customer?.email || order.user,
    subject: `Order #${String(order._id).slice(-6)} is ${status.replace('_', ' ')}`,
    body: `Your order status changed to: ${status}`,
    meta: { orderId: order._id, status },
  });
}
