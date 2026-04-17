import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js'; 

dotenv.config();

const productsData = [
    {
        name: "Rose Hydrating Lip Balm",
        description: "A deeply nourishing everyday lip balm that melts into your lips, providing long-lasting hydration with a subtle, healthy sheen. Infused with real rose extract.",
        category: "Balms",
        basePrice: 250,
        imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop",
        ingredients: "Organic Beeswax, Shea Butter, Rosehip Oil, Vitamin E, Sweet Almond Oil.",
        howToUse: "Apply generously to lips as often as needed, especially in dry, cold, or windy conditions.",
        size: "15g",
        variants: [
            { id: "v1", value: "Clear", shadeColor: "#F5F5DC", stock: 50 },
            { id: "v2", value: "Soft Rose", shadeColor: "#E0BFB8", stock: 30, basePrice: 270 }
        ]
    },
    {
        name: "Berry Lip Tint",
        description: "A lightweight, buildable lip tint that gives your lips a natural, just-bitten flush of color. Formulated to be transfer-proof and hydrating.",
        category: "Tints",
        basePrice: 350,
        imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop",
        ingredients: "Water, Glycerin, Aloe Vera Extract, Natural Berry Pigments, Hyaluronic Acid.",
        howToUse: "Dab a small amount onto the center of your lips and blend outward with your finger for a natural gradient look.",
        size: "10ml",
        variants: [
            { id: "v3", value: "Cherry Red", shadeColor: "#990F02", stock: 25 },
            { id: "v4", value: "Plum Berry", shadeColor: "#673147", stock: 15 }
        ]
    },
    {
        name: "Vanilla Sugar Scrub",
        description: "An exfoliating lip scrub that gently buffs away dry, flaky skin, leaving your lips incredibly soft, smooth, and prepped for color.",
        category: "Scrubs",
        basePrice: 180,
        imageUrl: "https://images.unsplash.com/photo-1556228720-192a6af4e865?q=80&w=800&auto=format&fit=crop",
        ingredients: "Fine Brown Sugar, Coconut Oil, Vanilla Bean Extract, Jojoba Oil.",
        howToUse: "Take a pea-sized amount and gently massage over lips in circular motions. Wipe off with a damp tissue or rinse with water.",
        size: "20g",
        variants: [
            { id: "v5", value: "Standard", shadeColor: "#D4B895", stock: 40 }
        ]
    },
    {
        name: "Velvet Matte Liquid Lip",
        description: "A highly pigmented, long-wearing liquid lipstick that dries down to a comfortable, non-drying matte finish. Perfect for all-day wear.",
        category: "Lipsticks",
        basePrice: 450,
        imageUrl: "https://images.unsplash.com/photo-1581337204873-ef36aa186caa?q=80&w=800&auto=format&fit=crop",
        ingredients: "Isododecane, Dimethicone, Mineral Pigments, Avocado Oil, Silica.",
        howToUse: "Use the applicator to line the lips, then fill in the center. Allow 30 seconds to set completely dry.",
        size: "8ml",
        variants: [
            { id: "v6", value: "Nude Peach", shadeColor: "#E5B39E", stock: 20 },
            { id: "v7", value: "Deep Burgundy", shadeColor: "#600000", stock: 10 }
        ]
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB...');

        await Product.deleteMany();
        console.log('🧹 Cleared old products...');

        await Product.insertMany(productsData);
        console.log('🌱 Database Seeded Successfully with NYLA products!');

        process.exit();
    } catch (error) {
        console.error('❌ Error with data import:', error);
        process.exit(1);
    }
};

seedDatabase();