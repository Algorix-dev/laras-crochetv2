import mongoose from 'mongoose';

// TIP: a customer's review of a piece. It starts as "pending" and only shows
// on the product page once Lara approves it in the admin (Product Reviews).
// Only a signed-in customer who has PAID for that piece can write one — which
// is also what the "verified" label on the product page stands for.
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: String, // snapshot, so the admin list still reads well if the piece is renamed
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    reviewerName: { type: String, required: true }, // shown publicly, e.g. "Amara O."
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    text: { type: String, required: true },
    fit: { type: String, enum: ['small', 'true', 'large'], default: 'true' },
    variant: String, // e.g. "Navy mix · Size M", copied from their order
    status: { type: String, enum: ['pending', 'approved', 'hidden'], default: 'pending' },
  },
  { timestamps: true }
);

// one review per customer per piece
reviewSchema.index({ product: 1, customerEmail: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
