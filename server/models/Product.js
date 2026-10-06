import mongoose from 'mongoose';

// TIP — COLOR / SHADE OPTIONS LARA CAN EDIT IN THE ADMIN PAGE: each option is
// a name ("Lavender") plus a hex color ("#B7A6E8"). They live in NEW fields
// (colorOptions / shadeOptions) so the older `colors` / `shades` arrays of
// plain hex strings keep working untouched for pieces saved before this.
const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  },
  { _id: false }
);

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
      // TIP: no fixed list here any more. Lara can add her own categories, so the
      // allowed names are checked in routes/products.js against routes/categories.js.
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
    // TIP — PRICING EXTRAS (all optional). salePrice must be lower than price. The sale runs
    // from saleStart to saleEnd (either can be empty). utils/pricing.js decides if it is live.
    salePrice: { type: Number, min: 0, default: null },
    saleStart: { type: Date, default: null },
    saleEnd: { type: Date, default: null },
    // true = the price already includes tax (the shop shows a small "Tax included" note)
    taxIncluded: { type: Boolean, default: true },
    // a small badge on the card and product page: 'New', 'Bestseller', ... (see TAGS in routes/products.js)
    tag: { type: String, default: '' },

    // TIP — IMAGE BACKGROUND COLOUR per photo. When a photo has no see-through parts, the
    // upload measures its edge colour once and saves it here, so the product card / page can
    // be painted the same colour and no visible box appears around the photo. Empty = unknown.
    viewBg: {
      front: { type: String, default: '' },
      left: { type: String, default: '' },
      right: { type: String, default: '' },
      back: { type: String, default: '' },
    },

    colors: [{ type: String }], // hex codes, e.g. '#1c1c22'  (older pieces)
    shades: [{ type: String }],
    colorOptions: [optionSchema], // { name, hex } — edited in the admin page
    shadeOptions: [optionSchema],
    sizes: [{ type: String }], // e.g. ['XS','S','M','XL','XXL']
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }, // lets Lara hide instead of delete
  },
  { timestamps: true } // adds createdAt/updatedAt automatically
);

export default mongoose.model('Product', productSchema);