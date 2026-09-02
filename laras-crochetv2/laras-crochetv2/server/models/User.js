import mongoose from 'mongoose';

// TIP: a sub-schema, nested inside User rather than its own top-level
// model+collection. Addresses only ever make sense attached to a
// user — nobody queries "all addresses across all users" — so
// embedding them here (as an array field on the user document) is
// simpler than a separate Address collection with a userId reference.
const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: {
    code: String,
    name: String,
    dial: String,
    flag: String,
  },
  phone: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, default: '' },
    loyaltyStatus: { type: String, default: 'Guest' },
    addresses: [addressSchema],

    // TIP: the current one-time code and its expiry live directly on
    // the user document rather than a separate collection — simplest
    // option for a single active code per user at a time. A new
    // request-code call just overwrites these two fields.
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
