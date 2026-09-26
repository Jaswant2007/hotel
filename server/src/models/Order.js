import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Order Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    isVeg: { type: Boolean, default: true },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    line1: { type: String, required: true },
    area: { type: String },
    city: { type: String, default: 'Chennai' },
    pincode: { type: String, required: true },
    phone: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    isFirstOrderDiscount: { type: Boolean, default: false },
    isPickup: { type: Boolean, default: false },
    deliveryAddress: { type: addressSchema },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    etaMinutes: { type: Number, default: 45 },
    estimatedAt: { type: Date },
    customerNote: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (this.estimatedAt) return next();
  const mins = this.isPickup ? 20 : this.etaMinutes;
  const base = this.createdAt ? new Date(this.createdAt) : new Date();
  this.estimatedAt = new Date(base.getTime() + mins * 60 * 1000);
  next();
});

orderSchema.methods.toCustomerJSON = function () {
  const obj = this.toObject();
  obj.statusText = STATUS_LABELS[obj.status] || obj.status;
  return obj;
};

export default mongoose.model('Order', orderSchema);
