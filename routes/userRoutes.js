import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

import { getUsers, getUserDetailsForAdmin, toggleWishlist, forgotPassword, resetPassword } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};


router.route('/')
    // (Register) - POST /api/users
    .post(async (req, res) => {
        try {
            const { name, email, password, phone, address, city } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: 'User already exists - الإيميل ده متسجل قبل كده' });
            }

            const user = await User.create({
                name,
                email,
                password,
                phone,
                address,
                city
            });

            if (user) {
                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    city: user.city,
                    isAdmin: user.isAdmin,
                    token: generateToken(user._id)
                });
            } else {
                res.status(400).json({ message: 'Invalid user data' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    })
    // 2.GET /api/users
    .get(protect, admin, getUsers);




// 3. )Login) - POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});




router.route('/:id/details')
    .get(protect, admin, getUserDetailsForAdmin);

router.route('/wishlist')
    .post(protect, toggleWishlist);

router.post('/forgotpassword', forgotPassword);

router.put('/resetpassword/:token', resetPassword);
export default router;