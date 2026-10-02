import crypto from 'crypto';
import mongoose from 'mongoose';

// TIP: one document per email address that has opted in to Lara's news.
// `subscribed: false` means they unsubscribed (or never opted in) — the
// campaign sender ONLY ever picks `subscribed: true`, so someone who isn't
// subscribed never receives a newsletter. We keep the row (instead of
// deleting it) so a person who unsubscribed isn't re-added by accident and
// so Lara can see her numbers.
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subscribed: { type: Boolean, default: true },
    source: { type: String, enum: ['footer', 'checkout', 'admin'], default: 'footer' },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
    // Random string used in the "Unsubscribe" link at the bottom of every email.
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
  },
  { timestamps: true }
);

export default mongoose.model('Subscriber', subscriberSchema);
