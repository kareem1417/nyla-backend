import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    // 1. خلينا اليوزر مش إجباري (required: false) عشان لو زائر
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    // 2. بيانات المشتري الأساسية
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },

    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true }, // 👈 رجعناها زي ما كانت
            variantId: { type: String, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String },
        phone: { type: String, required: true }
    },
    paymentMethod: { type: String, required: true, default: 'Cash On Delivery' },

   
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 }, 
    discountAmount: { type: Number, default: 0 }, 
    couponCodeUsed: { type: String, default: null }, 
    totalPrice: { type: Number, required: true, default: 0.0 }, 
    // ==========================================

    isShipped: { type: Boolean, required: true, default: false },
    shippedAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    isCancelled: { type: Boolean, required: true, default: false },
    cancelledAt: { type: Date }

}, {
    timestamps: true
});

export default mongoose.model('Order', orderSchema);