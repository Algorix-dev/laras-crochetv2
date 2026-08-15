// Run once with: node seedAdmin.js
// Creates the first admin login (e.g. for Lara or yourself).
// Edit the email/password/name below before running.
import "dotenv/config";
import { connectDB } from "./config/db.js";
import AdminUser from "./models/AdminUser.js";
import mongoose from "mongoose";

await connectDB();

const existing = await AdminUser.findOne({ email: "lara@example.com" });
if (existing) {
  console.log("Admin already exists for that email — nothing to do.");
} else {
  await AdminUser.create({
    email: "lara@admin.com",
    password: "laraspassword",
    name: "Lara",
  });
  console.log("Admin user created.");
}

await mongoose.disconnect();
