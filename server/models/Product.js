import mongoose from 'mongoose';

// TIP: this schema deliberately mirrors the shape of the frontend's
// existing src/data/products.js (name, price, colors, shades, sizes)
// so that migrating the frontend to fetch from the API later is a
// small change, not a rewrite.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['dresses', 'bikinis', 'two-pieces', 'shirts', 'skirts'],
    },
    // Cloudinary URLs, not local file paths — see routes/upload.js
    images: [{ type: String, required: true }],
    colors: [{ type: String }], // hex codes, e.g. '#1c1c22'
    shades: [{ type: String }],
    sizes: [{ type: String }], // e.g. ['XS','S','M','XL','XXL']
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }, // lets Lara hide instead of delete
  },
  { timestamps: true } // adds createdAt/updatedAt automatically
);

export default mongoose.model('Product', productSchema);
