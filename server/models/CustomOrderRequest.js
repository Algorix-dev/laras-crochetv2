import mongoose from 'mongoose';

// TIP: a customer's custom-order submission from ContactPage.jsx (the
// "photo" step of the custom-order wizard). Saved to the DB first, THEN
// emailed to Lara — so even if the email fails, nothing is lost and you
// can always build a proper admin list view on top of this collection
// later without needing customers to resubmit anything.
const customOrderRequestSchema = new mongoose.Schema(
  {
    customerEmail: { type: String, required: true },
    garmentType: String,
    sizeChoice: String,
    customMeasurements: {
      size: String,
      bust: String,
      waist: String,
      hip: String,
    },
    colorNote: String,
    colorSwatch: String, // hex the customer picked, e.g. #7a1f3d
    otherFitDetails: String, // 'Other' garment path: what the piece should be
    customDetails: String,
    // Cloudinary URLs — uploaded WITHOUT background removal, since these
    // are the customer's own reference photos, not product shots.
    photoUrls: [String],
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

export default mongoose.model('CustomOrderRequest', customOrderRequestSchema);
