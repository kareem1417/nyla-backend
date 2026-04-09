import express from 'express';
import { createCoupon, getCoupons, deleteCoupon, verifyCoupon } from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// راوتس الأدمن (يضيف ويجيب كل الكوبونات ويمسح)
router.route('/')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.route('/:id')
    .delete(protect, admin, deleteCoupon);

// راوت العميل (عشان يفحص الكوبون وهو بيعمل أوردر)
router.post('/verify', protect, verifyCoupon);

export default router;