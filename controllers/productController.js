import Product from '../models/Product.js'; // 👈 اتأكد إن مسار الموديل ده صح عندك

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne(); // مسح المنتج من الداتا بيز
            res.json({ message: 'Product removed successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const { name, basePrice, category, imageUrl, description, ingredients, howToUse, size, variants } = req.body;

        const product = new Product({
            name,
            basePrice,
            category,
            imageUrl,
            description,
            ingredients,
            howToUse,
            size,
            isBestSeller: false,
            variants: variants || []
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error("Error creating product:", error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const { name, basePrice, category, imageUrl, description, ingredients, howToUse, size, variants, isBestSeller } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name;
            product.basePrice = basePrice;
            product.category = category;
            product.imageUrl = imageUrl;
            product.description = description;
            product.ingredients = ingredients;
            product.howToUse = howToUse;
            product.size = size;
            product.variants = variants;
            product.isBestSeller = isBestSeller;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'You have already reviewed this product' });
            }

            
            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);

            
            product.numReviews = product.reviews.length;
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added successfully! ⭐' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error adding review' });
    }
};

// @desc    Get related products (Same category)
// @route   GET /api/products/:id/related
export const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            const related = await Product.find({
                category: product.category,
                _id: { $ne: product._id }
            }).limit(4); 
            res.json(related);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};



