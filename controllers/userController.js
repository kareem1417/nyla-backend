import User from '../models/User.js';
import Order from '../models/Order.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';


// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;
            user.city = req.body.city || user.city; // 👈 ضفنا الـ City هنا

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                city: updatedUser.city,
                isAdmin: updatedUser.isAdmin,
                token: req.headers.authorization.split(' ')[1],
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all users (For Admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        // بنجيب كل اليوزرز من غير الباسورد
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching users' });
    }
};

// @desc    Get specific user details (Profile + Orders + Wishlist)
// @route   GET /api/users/:id/details
// @access  Private/Admin
export const getUserDetailsForAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. نجيب بيانات اليوزر والـ Wishlist بتاعته (بنعرض اسم المنتج وصورته وسعره)
        const user = await User.findById(userId)
            .select('-password')
            .populate('wishlist', 'name imageUrl basePrice');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. نجيب كل الأوردرات اللي اليوزر ده عملها قبل كده
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        // 3. نبعت الداتا كلها متجمعة للأدمن
        res.json({
            ...user._doc, // بيانات اليوزر والمفضلة
            orders        // تاريخ طلباته
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching user details' });
    }
};
// @desc    Add or remove product from wishlist
// @route   POST /api/users/wishlist
// @access  Private (لليوزرز اللي مسجلين دخول بس)
export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            // بنشوف هل المنتج ده موجود أصلاً في مفضلة اليوزر ولا لأ
            const alreadyAdded = user.wishlist.includes(productId);

            if (alreadyAdded) {
                // لو موجود -> امسحه
                user.wishlist = user.wishlist.filter(id => id.toString() !== productId.toString());
                await user.save();
                res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
            } else {
                // لو مش موجود -> ضيفه
                user.wishlist.push(productId);
                await user.save();
                res.json({ message: 'Product added to wishlist', wishlist: user.wishlist });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error in wishlist' });
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'There is no user with that email' });
        }

        // 1. عمل كود سري عشوائي
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 2. تشفير الكود وحفظه في الداتا بيز لمدة 10 دقايق بس
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 دقايق
        await user.save();

        // 3. تجهيز اللينك اللي هيتبعت في الإيميل (لينك الفرونت إند)
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        // 4. إرسال الإيميل
        const message = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; text-align: center;">
                <h2 style="color: #4a0404;">NYLA Cosmetics</h2>
                <p>You requested a password reset. Click the button below to set a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #4a0404; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p style="font-size: 12px; color: #888;">This link expires in 10 minutes.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'NYLA - Password Reset Request',
            html: message,
        });

        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        // لو حصل مشكلة نمسح الكود من الداتا بيز
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
        }
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:token
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during password reset' });
    }
};