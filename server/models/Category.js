import mongoose from 'mongoose';

// TIP: the built-in categories (dresses, bikinis, ...) live in routes/categories.js.
// This model stores the EXTRA ones Lara adds from the admin Categories page, and also a small
// "removed" marker (removed: true) for each built-in one she has deleted, so it stays gone.
const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used in URLs, e.g. "crop-tops"
    label: { type: String, required: true, trim: true }, // shown to people, e.g. "Crop Tops"
    removed: { type: Boolean, default: false }, // true = a built-in category Lara deleted (hidden everywhere)
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
