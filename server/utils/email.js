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

export async function sendCustomOrderNotification(request) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return console.warn('ADMIN_NOTIFY_EMAIL not set — skipping notification');

  const photos = request.photoUrls?.length
    ? request.photoUrls.map((url) => `<a href="${url}">${url}</a>`).join('<br/>')
    : 'No photos attached';

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to,
    subject: `Custom order request — ${request.customerEmail}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">New custom order request</p>
        <p><strong>From:</strong> ${request.customerEmail}</p>
        <p><strong>Garment:</strong> ${request.garmentType || '—'} | <strong>Size:</strong> ${request.sizeChoice || '—'}</p>
        <p><strong>Color note:</strong> ${request.colorNote || '—'}</p>
        <p><strong>Details:</strong> ${request.customDetails || '—'}</p>
        <p><strong>Reference photos:</strong><br/>${photos}</p>
      </div>
    `,
  });
  if (error) console.error('Custom-order notification email failed:', error);
}

export async function sendAdminOrderNotification(order) {
  const to = process.env.ADMIN_NOTIFY_EMAIL; // set this to her Gmail address
  if (!to) return console.warn('ADMIN_NOTIFY_EMAIL not set — skipping order notification');

  const itemLines = order.items
    .map((i) => `${i.quantity} × ${i.name} (${i.color}, ${i.size}) — ₦${i.price.toLocaleString()}`)
    .join('<br/>');

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to,
    subject: `New order ${order.orderNumber || order.paystackReference} — ₦${order.totalAmount.toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">New order received</p>
        <p><strong>${order.orderNumber || order.paystackReference}</strong> — ${order.customerName} (${order.customerEmail})</p>
        <p>${itemLines}</p>
        <p><strong>Total:</strong> ₦${order.totalAmount.toLocaleString()} (incl. ${order.shippingMethod} shipping)</p>
        <p><strong>Ship to:</strong> ${order.shippingAddress}</p>
      </div>
    `,
  });
  if (error) console.error('Order-notification email failed:', error);
}

export async function sendOrderConfirmationEmail(order) {
  const itemLines = order.items
    .map((i) => `${i.quantity} × ${i.name} (${i.color}, ${i.size}) — ₦${i.price.toLocaleString()}`)
    .join('<br/>');

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to: order.customerEmail,
    subject: `Order confirmed — ${order.orderNumber || order.paystackReference}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">Thank you, ${order.customerName}!</p>
        <p style="color: #737373;">Your order <strong>${order.orderNumber || order.paystackReference}</strong> is confirmed.</p>
        <p>${itemLines}</p>
        <p><strong>Total:</strong> ₦${order.totalAmount.toLocaleString()} (incl. ${order.shippingMethod} shipping)</p>
        <p><strong>Shipping to:</strong> ${order.shippingAddress}</p>
        <p style="color: #A3A3A3; font-size: 13px; margin-top: 24px;">
          You can track this order any time using your order number or Paystack reference.
        </p>
      </div>
    `,
  });
  // TIP: don't throw. A failed customer email should never undo a
  // successful payment or crash markPaid — same pattern as the two
  // functions above it.
  if (error) console.error('Order-confirmation email failed:', error);
}