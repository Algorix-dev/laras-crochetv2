import mongoose from 'mongoose';

// TIP: Lara's brand settings. There is only ever ONE of these (a "singleton"),
// found by its fixed _id. Empty fields mean "use the site's built-in default".
const brandSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'brand' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '' }, // "#rrggbb" or empty
    instagramUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Brand', brandSchema);
