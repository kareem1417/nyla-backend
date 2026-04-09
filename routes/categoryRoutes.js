import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js'; // تأكد إن مسار الـ middleware صح عندك

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, admin, createCategory);

router.route('/:id')
    .delete(protect, admin, deleteCategory);

export default router;