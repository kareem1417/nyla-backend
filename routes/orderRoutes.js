import express from 'express';
import {
    addOrderItems,
    getOrders,
    updateOrderToDelivered,
    updateOrderToShipped,
    updateOrderToCancelled,
    getOrderStats,
    getMyOrders
} from '../controllers/orderController.js';
import { optionalAuth, protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// المسارات العامة (بتاخد optionalAuth) ومسارات الأدمن العادية
router.route('/')
    .post(optionalAuth, addOrderItems)
    .get(protect, admin, getOrders);

// مسار إحصائيات الأدمن
router.get('/stats', protect, admin, getOrderStats);

// مسار أوردرات العميل (لازم يكون فوق المسارات اللي فيها :id)
router.route('/myorders').get(protect, getMyOrders);

// مسارات التحكم في حالة الأوردر للأدمن
router.route('/:id/ship').put(protect, admin, updateOrderToShipped);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, admin, updateOrderToCancelled);

export default router;