import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';

// 🚨 مهم جداً: غير اسم ملف الـ auth واسم دالة الأدمن حسب اللي موجودين في مشروعك فعلاً
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, admin, updateSettings);

export default router;