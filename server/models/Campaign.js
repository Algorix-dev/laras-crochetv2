import mongoose from 'mongoose';

// TIP: a record of every newsletter Lara has sent from the admin, so she can
// see what went out, when, and to how many people.
const campaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true }, // plain text, line breaks kept
    recipientCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    sentBy: String,
  },
  { timestamps: true }
);

export default mongoose.model('Campaign', campaignSchema);
