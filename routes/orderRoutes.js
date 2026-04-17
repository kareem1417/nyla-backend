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

router.route('/')
    .post(optionalAuth, addOrderItems)
    .get(protect, admin, getOrders);

router.get('/stats', protect, admin, getOrderStats);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id/ship').put(protect, admin, updateOrderToShipped);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, admin, updateOrderToCancelled);

export default router;