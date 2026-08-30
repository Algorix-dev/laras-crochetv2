import mongoose from 'mongoose';

// TIP: this runs once when the server starts. Everything else in
// the app (models, routes) assumes this connection is already open —
// that's why index.js calls this BEFORE it starts listening for
// requests, not after.
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    // TIP: if the database can't connect, the app is useless —
    // better to crash loudly on startup than run silently broken.
    process.exit(1);
  }
}
