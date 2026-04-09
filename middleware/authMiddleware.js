import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // 👈 اتأكد إن اسم ملف اليوزر عندك كده بالظبط (لو اسمه user.js عدلها)

// 1. حارس التأكد من تسجيل الدخول (للعميل والأدمن)
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // سحب التوكن من الهيدر
            token = req.headers.authorization.split(' ')[1];

            // فك التشفير والتأكد منه
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // بنجيب بيانات اليوزر من الداتا بيز (من غير الباسوورد) ونحطها في الـ request
            req.user = await User.findById(decoded.id).select('-password');

            next(); // عدي يا باشا
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// حارس مرن: بيتعرف على اليوزر لو عامل لوجن، ولو زائر بيعديه عادي من غير ما يطرده
export const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
        } catch (error) {
            console.error("Invalid token, but letting guest pass");
        }
    }

    // في كل الحالات هيعدي للخطوة اللي بعدها (عكس protect اللي كانت بتعمل res.status(401))
    next();
};

// 2. حارس التأكد من صلاحيات الإدارة (للأدمن بس 👑)
export const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next(); // لو هو أدمن، خليه يكمل للخطوة اللي بعدها (يمسح أو يضيف)
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};