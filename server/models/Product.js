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
    // TIP: `images` is kept for older code (ProductCard reads images[0]).
    // The admin page now keeps images[0] equal to views.front.
    images: [{ type: String, required: true }],

    // TIP — ANGLE SHOTS. One photo per direction, same outfit:
    //   front : facing the camera (main photo, hero middle slot)
    //   left  : model turned toward the LEFT of the screen  (hero, left side)
    //   right : model turned toward the RIGHT of the screen (hero, right side)
    //   back  : seen from behind
    // The product page shows these four as its thumbnails (empty = placeholder);
    // the hero uses front / left / right. Empty string = "not uploaded yet".
    views: {
      front: { type: String, default: '' },
      left: { type: String, default: '' },
      right: { type: String, default: '' },
      back: { type: String, default: '' },
    },

    // TIP — WHERE THE PIECE APPEARS, besides the Shop (every active piece
    // is always in the Shop). 'hero' = the carousel at the top of the home
    // page, 'featured' = the "Shop Our Pieces" row on the home page.
    placements: [{ type: String, enum: ['hero', 'featured'] }],
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
