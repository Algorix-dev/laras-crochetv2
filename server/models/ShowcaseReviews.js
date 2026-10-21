import mongoose from 'mongoose';

// TIP: the nine reviews on the home page (the "Lara showcase" section). There is only ever ONE of these
// (a "singleton", like Brand), found by its fixed _id. No document yet = the site shows its built-in reviews.
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    quote: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const showcaseReviewsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'showcase' },
    items: [itemSchema],
  },
  { timestamps: true }
);

export default mongoose.model('ShowcaseReviews', showcaseReviewsSchema);
