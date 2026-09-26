import DeliveryZone from '../models/DeliveryZone.js';

/**
 * Compute the delivery fee for an order.
 *  - Pickup → ₹0
 *  - Otherwise look for a pincode zone (DeliveryZone collection)
 *  - Free delivery above FREE_DELIVERY_OVER (₹0 when unset/0)
 *  - Fall back to DEFAULT_DELIVERY_FEE
 */
export async function computeDeliveryFee({ pincode, isPickup, subtotal }) {
  if (isPickup) return 0;

  const freeOver = Number(process.env.FREE_DELIVERY_OVER ?? 500);
  if (freeOver > 0 && subtotal >= freeOver) return 0;

  if (pincode) {
    const zone = await DeliveryZone.findOne({ active: true, pincodes: String(pincode) });
    if (zone) return zone.fee;
  }
  return Number(process.env.DEFAULT_DELIVERY_FEE ?? 20);
}

/** First-order discount: 10% of subtotal when the flag is still set. */
export function computeFirstOrderDiscount(subtotal, isFirstOrder) {
  if (!isFirstOrder) return 0;
  return Math.round(subtotal * 0.1);
}

/** Final money breakdown shared by checkout + order JSON. */
export function buildTotals({ subtotal, discount, deliveryFee }) {
  const total = Math.max(0, subtotal - discount + deliveryFee);
  return { subtotal, discount, deliveryFee, total };
}
