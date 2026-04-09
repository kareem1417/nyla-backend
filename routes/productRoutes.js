import express from 'express';
import {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview,
    getRelatedProducts
} from '../controllers/productController.js'; // متنساش الـ .js
import { protect, admin } from '../middleware/authMiddleware.js'; // متنساش الـ .js

const router = express.Router();

// مسار عرض كل المنتجات (متاح للكل) + إضافة منتج (للأدمن بس)
router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);
router.route('/:id/reviews')
    .post(protect, createProductReview);
router.get('/:id/related', getRelatedProducts);

// مسار عرض منتج واحد (متاح للكل) + مسح منتج (للأدمن بس)
router.route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);


export default router; // 👈 السطر ده اللي كان عامل المشكلة وصلحناه