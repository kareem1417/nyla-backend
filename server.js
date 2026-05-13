import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingRoutes from './routes/settingsRoutes.js';

const app = express();
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173', //my device
    'https://nyla-beauty.vercel.app/'
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingRoutes);

app.get('/', (req, res) => {
    res.send('NYLA Cosmetics API is running! 🚀');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
