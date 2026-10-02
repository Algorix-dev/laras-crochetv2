import mongoose from 'mongoose';

// TIP: a message from the "enquiry" side of the Contact page (sizing help,
// order status, payment, something else). Saved first, THEN emailed to Lara,
// so nothing is lost if the email fails — she can always read it in the admin.
const enquirySchema = new mongoose.Schema(
  {
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    topic: { type: String, default: 'Something else' },
    itemName: String,
    orderRef: String,
    message: String,
    sizingMeasurements: { size: String, bust: String, waist: String, hip: String },
    status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);
