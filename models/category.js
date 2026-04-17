import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' } 
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;