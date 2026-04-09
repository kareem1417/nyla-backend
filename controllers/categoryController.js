import Category from '../models/category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching categories' });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const { name, imageUrl, description } = req.body;

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) return res.status(400).json({ message: 'Category already exists' });

        const category = await Category.create({ name, imageUrl, description });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin 
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting category' });
    }
};