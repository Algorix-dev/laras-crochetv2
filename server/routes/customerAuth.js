import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/email.js";
import { requireCustomer } from "../middleware/requireCustomer.js";

const router = Router();
const CODE_EXPIRY_MINUTES = 10;
const MAX_WRONG_GUESSES = 5; // TIP: change this number to allow more or fewer tries

// TIP: crypto.randomInt is built for security-sensitive numbers.
// Math.random is predictable and shouldn't be used for login codes.
function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

// POST /api/auth/customer/request-code   body: { email }
router.post("/request-code", async (req, res) => {
  try {
    const email = req.body?.email;
    // TIP: insist on a string, because a non-string would crash toLowerCase().
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Enter a valid email" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // TIP: demo bypass. Delete DEMO_EMAIL and DEMO_CODE from Render before
    // going live and this switches itself off.
    const isDemo =
      process.env.DEMO_EMAIL &&
      normalizedEmail === process.env.DEMO_EMAIL.toLowerCase();

    const code = isDemo ? process.env.DEMO_CODE : generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // TIP: upsert = "find this user or create them", which is why sign-up and
    // sign-in are the same flow. otpAttempts resets whenever a fresh code is issued.
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { otpCode: code, otpExpiresAt: expiresAt, otpAttempts: 0 },
      { upsert: true, new: true },
    );

    if (isDemo) return res.json({ message: "Code sent" });

    try {
      await sendOtpEmail(normalizedEmail, code);
    } catch {
      return res
        .status(502)
        .json({ error: "Could not send the code, try again in a moment." });
    }
    res.json({ message: "Code sent" });
  } catch (err) {
    console.error("request-code error:", err);
    res.status(500).json({ error: "Something went wrong, try again" });
  }
});

// POST /api/auth/customer/verify-code   body: { email, code }
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (typeof email !== "string" || typeof code !== "string") {
      return res.status(400).json({ error: "Enter your email and code" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.otpCode) {
      return res.status(400).json({ error: "No code was requested for this email" });
    }
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "Code expired, request a new one" });
    }

    // TIP: after too many wrong guesses the code is thrown away, so nobody
    // can try all 1,000,000 possibilities.
    if ((user.otpAttempts || 0) >= MAX_WRONG_GUESSES) {
      user.otpCode = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(429).json({ error: "Too many wrong codes, request a new one" });
    }
    if (user.otpCode !== code) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: "Incorrect code" });
    }

    // single-use: clear the code once it works
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
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
  } catch (err) {
    console.error("verify-code error:", err);
    res.status(500).json({ error: "Something went wrong, try again" });
  }
});

// PATCH /api/auth/customer/me   body: { username }
// TIP: requireCustomer attaches req.customerId, so we never trust an id
// sent in the request body.
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