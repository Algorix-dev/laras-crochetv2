// Run once with: node seedAdmin.js
// Creates the first admin login (e.g. for Lara or yourself).
// Edit the email/password/name below before running.
import "dotenv/config";
import { connectDB } from "./config/db.js";
import AdminUser from "./models/AdminUser.js";
import mongoose from "mongoose";

await connectDB();

// TIP: EDIT THESE THREE before running. (The old file checked for one email
// but created another, so a second run crashed with a duplicate-key error;
// now the same constant is used for both.) Use a strong password, since
// this account can change every product on the shop.
const ADMIN_EMAIL = "lara@admin.com";
const ADMIN_PASSWORD = "laraspassword";
const ADMIN_NAME = "Lara";

const existing = await AdminUser.findOne({ email: ADMIN_EMAIL });
if (existing) {
  console.log("Admin already exists for that email — nothing to do.");
} else {
  await AdminUser.create({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME,
  });
  console.log("Admin user created.");
}

await mongoose.disconnect();
