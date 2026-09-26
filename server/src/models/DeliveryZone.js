import mongoose from 'mongoose';

/**
 * Optional pincode-based delivery zones used to compute delivery fees.
 * If no zone matches the pincode, DEFAULT_DELIVERY_FEE is used.
 */
const deliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    pincodes: { type: [String], required: true },
    fee: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('DeliveryZone', deliveryZoneSchema);
