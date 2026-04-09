import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });
const variantSchema = new mongoose.Schema({
    id: { type: String, required: true },
    value: { type: String, required: true },
    shadeColor: { type: String },
    stock: { type: Number, required: true, default: 0 },
    basePrice: { type: Number }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },

    ingredients: { type: String, required: true },
    howToUse: { type: String, required: true },
    size: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    category: { type: String, required: true },
    basePrice: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    isBestSeller: {
        type: Boolean,
        required: true,
        default: false
    },
    variants: [variantSchema]
}, {
    timestamps: true
});

export default mongoose.model('Product', productSchema);