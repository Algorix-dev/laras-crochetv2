import mongoose from 'mongoose';

// TIP — HOW VISITOR TRACKING STAYS TINY AND PRIVATE
// One document = "this visitor was on the site during this minute".
// The storefront sends a small "I'm here" ping when a page opens and then
// once a minute while the tab is visible, so:
//   - "users in the last 30 minutes"  = distinct visitorIds in the last 30 min
//   - "users per minute"              = how many documents each minute has
//   - "shop visitors this week"       = distinct visitorIds this week
// visitorId is a random code the browser makes up for itself — no name,
// email, IP address or anything else that identifies a person is stored.
const visitSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, maxlength: 64 },
  // the minute this visit falls in (seconds cut off) — makes the same visitor
  // pinging twice in one minute a no-op instead of a second document
  minute: { type: Date, required: true },
  // the last page they were on during that minute, e.g. "/shop"
  path: { type: String, default: '/', maxlength: 200 },
});

visitSchema.index({ visitorId: 1, minute: 1 }, { unique: true });

// MongoDB deletes each visit 45 days after its minute, so this collection
// never grows forever (this is also the index that speeds up date lookups)
visitSchema.index({ minute: 1 }, { expireAfterSeconds: 45 * 24 * 60 * 60 });

export default mongoose.model('Visit', visitSchema);
