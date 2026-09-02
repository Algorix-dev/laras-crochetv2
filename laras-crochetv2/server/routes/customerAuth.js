import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/email.js";
import { requireCustomer } from "../middleware/requireCustomer.js";

const router = Router();
const CODE_EXPIRY_MINUTES = 10;

function generateCode() {
  // TIP: a 6-digit numeric code, matching the 6-box UI on the frontend.
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/customer/request-code
// body: { email }
router.post("/request-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const normalizedEmail = email.toLowerCase();

  // TIP: a demo bypass so a specific email always works with a fixed
  // code, no real email needed — useful for showing the site to a
  // client before you fully trust email delivery (Resend's free tier
  // only sends to your own verified address until a sending domain is
  // verified). Set DEMO_EMAIL and DEMO_CODE in your .env / Render
  // environment variables. Leave them unset (or delete them later) to
  // turn this off completely — no code changes needed either way.
  const isDemo =
    process.env.DEMO_EMAIL &&
    normalizedEmail === process.env.DEMO_EMAIL.toLowerCase();

  const code = isDemo ? process.env.DEMO_CODE : generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // TIP: findOneAndUpdate with upsert:true means "find this user, or
  // create them if they don't exist yet" — this is what makes sign-up
  // and sign-in the SAME flow. There's no separate "create account"
  // step; the first time someone enters a code successfully for a
  // new email, an account is created for them automatically.
  await User.findOneAndUpdate(
    { email: normalizedEmail },
    { otpCode: code, otpExpiresAt: expiresAt },
    { upsert: true, new: true },
  );

  if (isDemo) {
    // TIP: skip sendOtpEmail entirely for the demo account — she just
    // always uses the fixed DEMO_CODE, so there's no real email that
    // could fail, land in spam, or get rate-limited.
    return res.json({ message: "Code sent" });
  }

  // TIP: now that sendOtpEmail actually talks to a real email
  // provider, it can genuinely fail (bad API key, unverified domain,
  // rate limit, etc.) — wrapping it means a failure here returns a
  // clean JSON error instead of an unhandled-rejection crash.
  try {
    await sendOtpEmail(email, code);
  } catch {
    return res
      .status(502)
      .json({ error: "Could not send the code — try again in a moment." });
  }

  res.json({ message: "Code sent" });
});

// POST /api/auth/customer/verify-code
// body: { email, code }
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !user.otpCode) {
    return res
      .status(400)
      .json({ error: "No code was requested for this email" });
  }
  if (user.otpExpiresAt < new Date()) {
    return res.status(400).json({ error: "Code expired — request a new one" });
  }
  if (user.otpCode !== code) {
    return res.status(400).json({ error: "Incorrect code" });
  }

  // TIP: clear the code once used — it's single-use, not reusable
  // until the next request-code call generates a fresh one.
  user.otpCode = null;
  user.otpExpiresAt = null;
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      loyaltyStatus: user.loyaltyStatus,
    },
  });
});

// PATCH /api/auth/customer/me
// body: { username }
// TIP: requireCustomer runs first, checks the JWT, and attaches
// req.customerId — that's how we know WHICH user to update without
// trusting an id sent in the request body (which anyone could fake).
router.patch("/me", requireCustomer, async (req, res) => {
  const { username } = req.body;
  if (typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ error: "Username is required" });
  }

  const user = await User.findByIdAndUpdate(
    req.customerId,
    { username: username.trim() },
    { new: true },
  );

  res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      loyaltyStatus: user.loyaltyStatus,
    },
  });
});

export default router;
