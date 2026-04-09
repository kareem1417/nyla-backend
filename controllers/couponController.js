import Coupon from '../models/coupon.js';

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expiryDate, targetUser } = req.body;

        const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercentage,
            expiryDate,
            targetUser: targetUser || null
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating coupon' });
    }
};

// @desc    Get all coupons (For Admin Panel)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).populate('targetUser', 'name email');
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching coupons' });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            await coupon.deleteOne();
            res.json({ message: 'Coupon deleted' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting coupon' });
    }
};

// @desc    Verify and Apply Coupon (For User Checkout)
// @route   POST /api/coupons/verify
// @access  Private
// جوه ملف couponController.js
export const verifyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user._id;


        if (!code || typeof code !== 'string') {
            return res.status(400).json({ message: 'Invalid coupon format' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
        if (!coupon.isActive) return res.status(400).json({ message: 'This coupon is no longer active' });

        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'This coupon has expired' });
        }

        if (coupon.targetUser && coupon.targetUser.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'This coupon is not valid for your account' });
        }


        if (coupon.usedBy.length >= coupon.usageLimit) {
            return res.status(400).json({ message: 'This coupon has reached its usage limit' });
        }


        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already used this coupon' });
        }

        res.json({
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            message: 'Coupon applied successfully! 🎉'
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error verifying coupon' });
    }
};