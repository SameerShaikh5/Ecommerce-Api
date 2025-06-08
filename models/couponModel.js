import mongoose from "mongoose"

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, 
  expiry: { type: Date, required: true },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 }
});

export const Coupon = mongoose.model('Coupon', couponSchema);
