import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    usageLimit: { type: Number, default: 1 }, 
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

const Coupon = mongoose.model('coupon', couponSchema);
export default Coupon;