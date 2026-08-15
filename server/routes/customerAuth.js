import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/email.js";

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

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // TIP: findOneAndUpdate with upsert:true means "find this user, or
  // create them if they don't exist yet" — this is what makes sign-up
  // and sign-in the SAME flow. There's no separate "create account"
  // step; the first time someone enters a code successfully for a
  // new email, an account is created for them automatically.
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { otpCode: code, otpExpiresAt: expiresAt },
    { upsert: true, new: true },
  );

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

export default router;
