import mongoose from 'mongoose';

// TIP: the five built-in categories (dresses, bikinis, ...) live in routes/categories.js.
// This model only stores the EXTRA ones Lara adds from the admin Categories page.
const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used in URLs, e.g. "crop-tops"
    label: { type: String, required: true, trim: true }, // shown to people, e.g. "Crop Tops"
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
