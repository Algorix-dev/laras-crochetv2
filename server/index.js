import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import customerAuthRoutes from "./routes/customerAuth.js";
import productRoutes from "./routes/products.js";
import uploadRoutes from "./routes/upload.js";
import paymentRoutes from "./routes/payments.js";
import orderRoutes from "./routes/orders.js";
import addressRoutes from "./routes/addresses.js";
import analyticsRoutes from "./routes/analytics.js";
import customOrderRoutes from "./routes/customOrders.js";
import shippingRoutes from "./routes/shipping.js";
import newsletterRoutes from "./routes/newsletter.js";
import enquiryRoutes from "./routes/enquiries.js";
import teamRoutes from "./routes/team.js";
import couponRoutes from "./routes/coupons.js";
import reviewRoutes from "./routes/reviews.js";
import brandRoutes from "./routes/brand.js";
import categoryRoutes from "./routes/categories.js";

await connectDB();

const app = express();

// TIP: Render puts a proxy in front of your app. Without this line the rate
// limiter sees every visitor as the same IP and could lock everyone out at once.
app.set("trust proxy", 1);

// TIP: helmet adds standard security headers with one line.
app.use(helmet());

// TIP: CLIENT_URL can hold a comma-separated list of allowed origins
// (localhost for dev, the Vercel URL, the real domain later).
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim());

app.use(
  cors({
    origin(origin, callback) {
      // TIP: undefined origin = Postman/curl/Paystack webhook, not a browser.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);

// TIP: rawBody is kept only for the Paystack webhook (its signature is
// computed over the exact bytes Paystack sent).
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/payments/webhook")) req.rawBody = buf;
    },
  })
);

// TIP: rate limits. To change how strict they are, edit max (number of
// tries) and windowMs (the time window, in milliseconds).
const tooMany = { error: "Too many attempts. Try again in a few minutes." };
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: tooMany,
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: tooMany,
});
// TIP: custom orders upload photos to Cloudinary, so cap them per IP.
const customOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: tooMany,
});
// TIP: the footer sign-up and the contact form are public and each one can
// trigger an email, so cap them per IP to stop someone using them to spam.
const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false, message: tooMany,
});
const pingLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/customer", otpLimiter);
app.post("/api/custom-orders", customOrderLimiter);
app.use("/api/analytics/ping", pingLimiter);
app.post("/api/newsletter/subscribe", publicFormLimiter);
app.post("/api/enquiries", publicFormLimiter);
// TIP: stops someone trying thousands of discount codes.
app.post("/api/coupons/validate", rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: tooMany }));
app.use("/api/auth/accept-invite", loginLimiter);
app.use("/api/orders/status", rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: tooMany }));

app.use("/api/auth", authRoutes);
app.use("/api/auth/customer", customerAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account/addresses", addressRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => res.send("Lara's Crochet API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));