import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/coupon.js';
import Setting from '../models/Setting.js';
import sendEmail from '../utils/sendEmail.js';

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
            shippingPrice = 50,
            couponCode,
            customerName,
            customerEmail
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items found' });
        }

        // Server-side price validation: compute the real items price
        let computedItemsPrice = 0;
        for (const item of orderItems) {
            const dbProduct = await Product.findById(item.product);
            if (!dbProduct) {
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }
            const effectivePrice = dbProduct.discountedPrice;
            computedItemsPrice += effectivePrice * item.qty;
        }
        computedItemsPrice = Math.round(computedItemsPrice * 100) / 100;

        // --- Buy 3 Get 1 Free logic ---
        let freeItemDiscount = 0;
        let freeItemName = null;

        const settings = await Setting.findOne();
        if (settings && settings.buyXGetCheapestFree) {

            // 1. فك المنتجات لمصفوفة بناءً على الكمية (qty)
            let allItemsExpanded = [];
            for (const item of orderItems) {
                const dbProduct = await Product.findById(item.product);
                if (dbProduct) {
                    const effectivePrice = dbProduct.discountedPrice || dbProduct.basePrice || 0;
                    for (let i = 0; i < item.qty; i++) {
                        allItemsExpanded.push({ price: effectivePrice, name: item.name || dbProduct.name });
                    }
                }
            }

            // 2. حساب عدد القطع الفري (Buy 3 Get 1 Free)
            const totalQty = allItemsExpanded.length;
            const freeItemsCount = Math.floor(totalQty / 4);

            if (freeItemsCount > 0) {
                // 3. الترتيب من الأرخص للأغلى
                allItemsExpanded.sort((a, b) => a.price - b.price);
                const freeItems = allItemsExpanded.slice(0, freeItemsCount);

                // 4. حساب الخصم النهائي
                freeItemDiscount = freeItems.reduce((sum, item) => sum + item.price, 0);
                freeItemDiscount = Math.round(freeItemDiscount * 100) / 100;

                const uniqueNames = [...new Set(freeItems.map(i => i.name))].join(' & ');
                freeItemName = uniqueNames;

                // 5. خصم المبلغ من إجمالي سلة المشتريات
                computedItemsPrice = Math.round((computedItemsPrice - freeItemDiscount) * 100) / 100;
            }
        }

        let finalDiscountAmount = 0;
        let finalItemsPrice = computedItemsPrice;

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

        // Free shipping if subtotal (after coupon) is 750 EGP or more
        const FREE_SHIPPING_THRESHOLD = 750;
        const finalShippingPrice = finalItemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : Number(shippingPrice);

        const finalTotalPrice = finalItemsPrice + finalShippingPrice;

        const order = new Order({
            user: req.user ? req.user._id : undefined,
            customerName: customerName,
            customerEmail: customerEmail,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice: computedItemsPrice,
            discountAmount: finalDiscountAmount,
            couponCodeUsed: couponCode ? couponCode.toUpperCase() : null,
            freeItemDiscount,
            freeItemName,
            shippingPrice: finalShippingPrice,
            totalPrice: finalTotalPrice
        });

        const createdOrder = await order.save();
        // 🌟 خصم الكمية من المخزون (Stock Deduction) 🌟
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (product && product.variants) {
                // بندور على الـ variant اللي العميل اشتراه
                const variantIndex = product.variants.findIndex(
                    v => v.id === item.variantId || v._id.toString() === item.variantId
                );

                // لو لقيناه، بننقص منه الكمية اللي العميل طلبها
                if (variantIndex !== -1) {
                    product.variants[variantIndex].stock -= item.qty;
                    // لزيادة الأمان: بنمنع المخزون ينزل تحت الصفر
                    if (product.variants[variantIndex].stock < 0) {
                        product.variants[variantIndex].stock = 0;
                    }
                    await product.save();
                }
            }
        }

        // 🌟 إرسال التنبيهات عبر الإيميل 🌟
        try {
            // 1. فاتورة العميل
            const invoiceHTML = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 16px;">
                    <h1 style="text-align: center; color: #800020; letter-spacing: 2px;">NYLA</h1>
                    <p>Hi ${createdOrder.customerName},</p>
                    <p>Thank you for your order! Here is your invoice summary:</p>
                    <hr style="border: 1px solid #eee;" />
                    <p><strong>Order ID:</strong> #${createdOrder._id.toString().substring(18)}</p>
                    <table style="width: 100%; text-align: left; margin-bottom: 20px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; color: #800020;">Product</th>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-align: center; color: #800020;">Qty</th>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-align: right; color: #800020;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${createdOrder.orderItems.map(item => `
                                <tr>
                                    <td style="padding: 8px 0;">${item.name} <br><small style="color: #888;">${item.variantId !== 'default' ? 'Shade: ' + item.variantId : ''}</small></td>
                                    <td style="padding: 8px 0; text-align: center;">${item.qty}</td>
                                    <td style="padding: 8px 0; text-align: right;">${item.price * item.qty} EGP</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <hr style="border: 1px solid #eee;" />
                    <p><strong>Subtotal:</strong> ${createdOrder.itemsPrice} EGP</p>
                    ${createdOrder.freeItemDiscount > 0 ? `<p style="color: green;"><strong>🎁 Free Item (${createdOrder.freeItemName}):</strong> -${createdOrder.freeItemDiscount} EGP</p>` : ''}
                    ${createdOrder.discountAmount > 0 ? `<p style="color: green;"><strong>Discount (${createdOrder.couponCodeUsed}):</strong> -${createdOrder.discountAmount} EGP</p>` : ''}
                    <p><strong>Shipping:</strong> ${createdOrder.shippingPrice === 0 ? 'FREE' : `${createdOrder.shippingPrice} EGP`}</p>
                    <h2 style="color: #800020;">Total: ${createdOrder.totalPrice} EGP</h2>
                    <p style="margin-top: 20px;"><strong>Shipping to:</strong> ${createdOrder.shippingAddress.address}, ${createdOrder.shippingAddress.city}</p>
                    <p style="text-align: center; font-size: 12px; color: #888; margin-top: 40px;">Nyla Cosmetics - Natural & Handcrafted</p>
                </div>
            `;

            await sendEmail({
                email: createdOrder.customerEmail,
                subject: 'Order Confirmation - NYLA Beauty 🌸',
                message: `Thank you for your order! Order ID: ${createdOrder._id}. Total Amount: ${createdOrder.totalPrice} EGP. We are preparing your beauty products now!`,
                html: invoiceHTML,
            });

            // 2. تنبيه لصاحب البراند (الأدمن)
            // 2. تنبيه لصاحب البراند (الأدمن)
            const adminAlertHTML = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 2px solid #800020; padding: 20px; border-radius: 12px;">
                    <h2 style="color: #800020; margin-top: 0;">🚨 New Order Alert! 💸</h2>
                    <p><strong>Customer Name:</strong> ${createdOrder.customerName}</p>
                    <p><strong>Phone Number:</strong> ${createdOrder.shippingAddress.phone}</p>
                    <p><strong>City/Area:</strong> ${createdOrder.shippingAddress.city}</p>
                    
                    <h3 style="color: #444; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Order Details:</h3>
                    <table style="width: 100%; text-align: left; margin-bottom: 20px; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; color: #800020;">Product</th>
                                <th style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-align: center; color: #800020;">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${createdOrder.orderItems.map(item => `
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #fafafa;">
                                        ${item.name} 
                                        ${item.variantId !== 'default' ? `<br><span style="color: #888; font-size: 12px;">Shade: ${item.variantId}</span>` : ''}
                                    </td>
                                    <td style="padding: 8px 0; text-align: center; border-bottom: 1px solid #fafafa;"><strong>${item.qty}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="background-color: #FAF8F6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0; color: #333;"><strong>Subtotal:</strong> ${createdOrder.itemsPrice} EGP</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Shipping:</strong> ${createdOrder.shippingPrice} EGP</p>
                        ${createdOrder.freeItemDiscount > 0 ? `<p style="margin: 5px 0; color: green;"><strong>🎁 Free Item:</strong> -${createdOrder.freeItemDiscount} EGP</p>` : ''}
                        ${createdOrder.discountAmount > 0 ? `<p style="margin: 5px 0; color: green;"><strong>Discount:</strong> -${createdOrder.discountAmount} EGP</p>` : ''}
                        <h3 style="margin: 10px 0 0 0; color: #800020; font-size: 20px;">Total Value: ${createdOrder.totalPrice} EGP</h3>
                    </div>

                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 13px; color: #666; text-align: center;">Please check your Admin Dashboard to view full details and prepare the shipment.</p>
                </div>
            `;

            await sendEmail({
                email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                subject: `🚨 New Order from ${createdOrder.customerName} - ${createdOrder.totalPrice} EGP`,
                message: `New order placed by ${createdOrder.customerName} for ${createdOrder.totalPrice} EGP.`,
                html: adminAlertHTML,
            });

            console.log("✅ Confirmation email sent to customer and Admin alert email sent!");

        } catch (err) {
            console.error("❌ Email service error:", err);
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
                    product.variants[variantIndex].stock += item.qty;
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