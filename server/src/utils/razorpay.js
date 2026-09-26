import Razorpay from 'razorpay';

/**
 * Lazily build a Razorpay client from env config.
 * Returns null when keys are not configured (demo mode).
 */
let instance = null;

export function getRazorpay() {
  if (instance) return instance;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  instance = new Razorpay({ key_id, key_secret });
  return instance;
}

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}
