import { Resend } from "resend";

// TIP: Resend's client is created once here, reading the API key
// from .env — same pattern as every other third-party client in this
// project (Cloudinary, Paystack all work the same way).
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email, code) {
  // TIP: "from" must be an address on a domain you've verified with
  // Resend — see server/README.md for the exact setup steps. Until
  // that's done, Resend's own onboarding@resend.dev address works
  // for testing, but only sends to the email you signed up to Resend
  // with (a safety limit on unverified accounts).
  const { error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to: email,
    subject: `Your Lara's Crochet code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040; margin-bottom: 4px;">Lara's Crochet</p>
        <p style="color: #737373; margin-bottom: 24px;">Here's your sign-in code:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #404040;">${code}</p>
        <p style="color: #A3A3A3; font-size: 13px; margin-top: 24px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    // TIP: throwing here (instead of silently swallowing the error)
    // means the /request-code route's try/catch — wherever it's
    // wired to respond with an error — actually surfaces the failure
    // to the frontend, rather than telling the user "code sent" when
    // it wasn't.
    console.error("Resend failed to send OTP email:", error);
    throw new Error("Could not send verification email");
  }
}
