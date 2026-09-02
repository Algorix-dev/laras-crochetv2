import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import customerAuthRoutes from "./routes/customerAuth.js";
import productRoutes from "./routes/products.js";
import uploadRoutes from "./routes/upload.js";
import paymentRoutes from "./routes/payments.js";
import orderRoutes from "./routes/orders.js";
import addressRoutes from "./routes/addresses.js";

await connectDB();

const app = express();

// TIP: cors() locked to a single origin means local dev
// (http://localhost:5173) and the deployed Vercel frontend can't
// both work at the same time — whichever one ISN'T in CLIENT_URL
// gets "Failed to fetch" from CORS silently rejecting it. Instead,
// CLIENT_URL can hold a comma-separated list of every origin that's
// allowed to call this API — add more (a staging URL, a custom
// domain) the same way, no code changes needed.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim());

app.use(
  cors({
    origin(origin, callback) {
      // TIP: `origin` is undefined for non-browser requests (like
      // Postman, curl, or Paystack's webhook) — those aren't subject
      // to CORS at all, so we let them through unconditionally.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);
app.use(express.json()); // lets req.body work for JSON requests

// TIP: every route file gets "mounted" under a base path here.
// A request to POST /api/auth/login actually runs the '/login'
// handler inside routes/auth.js — Express combines the prefix
// you set here with whatever path is defined inside that file.
app.use("/api/auth", authRoutes);
app.use("/api/auth/customer", customerAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account/addresses", addressRoutes);

app.get("/", (req, res) => res.send("Lara's Crochet API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
