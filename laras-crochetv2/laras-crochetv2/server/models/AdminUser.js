import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// TIP: this is deliberately separate from any future "customer
// account" model. Admins (Lara, you) and customers are different
// concepts with different permissions — mixing them into one model
// with a "role" field gets messy fast. Two small models beats one
// confusing one.
const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
  name: { type: String, required: true },
});

// TIP: a Mongoose "pre-save hook" — this function runs automatically
// right before any AdminUser document is saved. It hashes the
// password IF it was just set/changed, so you never accidentally
// save a plain-text password even if you forget to hash it manually
// somewhere else in the code.
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// TIP: instance method — lets you call adminUser.comparePassword(x)
// anywhere you have an AdminUser document, instead of importing
// bcrypt and repeating this logic in every route that checks a login.
adminUserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('AdminUser', adminUserSchema);
