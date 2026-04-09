import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/coupon.js';
import sendEmail from '../utils/sendEmail.js';
// @desc    Create new order & Deduct Stock
// @route   POST /api/orders
// @access  Private
// @desc    Create new order & Deduct Stock
// @route   POST /api/orders
// @access  Private / Public
export const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            couponCode,
            customerName,
            customerEmail
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items found' });
        }

        let finalDiscountAmount = 0;
        let finalItemsPrice = Number(itemsPrice);

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

            if (coupon) {
                const isExpired = new Date(coupon.expiryDate) < new Date();
                const isLimitReached = coupon.usedBy.length >= coupon.usageLimit;


                const isAlreadyUsed = req.user ? coupon.usedBy.includes(req.user._id) : false;
                const isTargetUser = coupon.targetUser ? (req.user && coupon.targetUser.toString() === req.user._id.toString()) : true;

                if (coupon.isActive && !isExpired && !isLimitReached && !isAlreadyUsed && isTargetUser) {
                    finalDiscountAmount = (finalItemsPrice * coupon.discountPercentage) / 100;
                    finalItemsPrice = finalItemsPrice - finalDiscountAmount;


                    if (req.user) {
                        coupon.usedBy.push(req.user._id);
                        await coupon.save();
                    }
                } else {
                    return res.status(400).json({ message: 'Coupon is no longer valid or has expired' });
                }
            }
        }

        const finalTotalPrice = finalItemsPrice + Number(shippingPrice);


        const order = new Order({
            user: req.user ? req.user._id : undefined,
            customerName: customerName,   // 👈 من الفورم
            customerEmail: customerEmail, // 👈 من الفورم
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice: Number(itemsPrice),
            discountAmount: finalDiscountAmount,
            couponCodeUsed: couponCode ? couponCode.toUpperCase() : null,
            shippingPrice: Number(shippingPrice),
            totalPrice: finalTotalPrice
        });

        const createdOrder = await order.save();


        try {
            const invoiceHTML = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px;">
                    <h1 style="text-align: center; color: #4a0404;">NYLA.</h1>
                    <p>Hi ${createdOrder.customerName},</p>
                    <p>Thank you for your order! Here is your invoice summary:</p>
                    <hr />
                    <p><strong>Order ID:</strong> #${createdOrder._id.toString().substring(18)}</p>
                    <table style="width: 100%; text-align: left; margin-bottom: 20px;">
                        <thead>
                            <tr>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px;">Product</th>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px;">Qty</th>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${createdOrder.orderItems.map(item => `
                                <tr>
                                    <td style="padding: 8px 0;">${item.name} <br><small style="color: #888;">${item.variantId !== 'default' ? 'Shade: ' + item.variantId : ''}</small></td>
                                    <td style="padding: 8px 0;">${item.qty}</td>
                                    <td style="padding: 8px 0; text-align: right;">${item.price * item.qty} EGP</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <hr />
                    <p><strong>Subtotal:</strong> ${createdOrder.itemsPrice} EGP</p>
                    ${createdOrder.discountAmount > 0 ? `<p style="color: green;"><strong>Discount (${createdOrder.couponCodeUsed}):</strong> -${createdOrder.discountAmount} EGP</p>` : ''}
                    <p><strong>Shipping:</strong> ${createdOrder.shippingPrice} EGP</p>
                    <h2 style="color: #4a0404;">Total: ${createdOrder.totalPrice} EGP</h2>
                    <p style="margin-top: 20px;"><strong>Shipping to:</strong> ${createdOrder.shippingAddress.address}, ${createdOrder.shippingAddress.city}</p>
                    <p style="text-align: center; font-size: 12px; color: #888; margin-top: 40px;">Nyla Cosmetics - Natural & Handcrafted</p>
                </div>
            `;

            await sendEmail({
                email: createdOrder.customerEmail,
                subject: `Your NYLA Order Invoice #${createdOrder._id.toString().substring(18)}`,
                html: invoiceHTML,
            });
        } catch (err) {
            console.error("Email failed to send", err);
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: 'Server error while creating order' });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {

        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update order to shipped
// @route   PUT /api/orders/:id/ship
// @access  Private/Admin
export const updateOrderToShipped = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.isShipped = true;
            order.shippedAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update order to cancelled & Return stock
// @route   PUT /api/orders/:id/cancel
// @access  Private/Admin
export const updateOrderToCancelled = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.isCancelled) return res.status(400).json({ message: 'Order already cancelled' });

        order.isCancelled = true;
        order.cancelledAt = Date.now();
        const updatedOrder = await order.save();

        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
                if (variantIndex !== -1) {
                    product.variants[variantIndex].stock += item.qty; // 👈 بنزود اللي اتخصم
                    await product.save();
                }
            }
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (req, res) => {
    try {
        const orders = await Order.find({});

        const totalSales = orders
            .filter(o => !o.isCancelled)
            .reduce((acc, item) => acc + item.totalPrice, 0);

        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => !o.isShipped && !o.isCancelled).length;
        const shippedOrders = orders.filter(o => o.isShipped && !o.isDelivered && !o.isCancelled).length;

        const salesData = await Order.aggregate([
            { $match: { isCancelled: false } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 7 }
        ]);

        const topProducts = await Order.aggregate([
            { $match: { isCancelled: false } },
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.name",
                    image: { $first: "$orderItems.image" },
                    totalSold: { $sum: "$orderItems.qty" },
                    revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalSales,
            totalOrders,
            pendingOrders,
            shippedOrders,
            salesData,
            topProducts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerEmail: req.user.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};