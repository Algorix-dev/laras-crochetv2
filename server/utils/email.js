import { Resend } from "resend";

// TIP: Resend's client is created once here, reading the API key
// from .env — same pattern as every other third-party client in this
// project (Cloudinary, Paystack all work the same way).
const resend = new Resend(process.env.RESEND_API_KEY);

// TIP: anything a customer typed (their email, the "details" box, a product
// name…) must be escaped before it goes inside an HTML email, otherwise someone
// could type <script> or a fake link into the form and it would land in Lara's
// inbox as real HTML.
export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FROM = () => process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>";

// TIP: the public address of THIS server, used for the unsubscribe link.
// Set API_PUBLIC_URL on Render (e.g. https://laras-api.onrender.com). Render
// also provides RENDER_EXTERNAL_URL automatically, which is the fallback.
const apiBase = () =>
  (process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000').replace(/\/$/, '');
const siteBase = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
export const unsubscribeUrl = (token) => `${apiBase()}/api/newsletter/unsubscribe/${token}`;

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
    ? request.photoUrls.map((url) => `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`).join('<br/>')
    : 'No photos attached';

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to,
    replyTo: request.customerEmail,
    subject: `Custom order request — ${request.customerEmail}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">New custom order request</p>
        <p><strong>From:</strong> ${escapeHtml(request.customerEmail)}</p>
        <p><strong>Garment:</strong> ${escapeHtml(request.garmentType) || '—'} | <strong>Size:</strong> ${escapeHtml(request.sizeChoice) || '—'}</p>
        ${request.otherFitDetails ? `<p><strong>What it should be:</strong> ${escapeHtml(request.otherFitDetails)}</p>` : ''}
        <p><strong>Color note:</strong> ${escapeHtml(request.colorNote) || '—'} ${request.colorSwatch ? `(${escapeHtml(request.colorSwatch)})` : ''}</p>
        <p><strong>Details:</strong> ${escapeHtml(request.customDetails) || '—'}</p>
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
    .map((i) => `${i.quantity} × ${escapeHtml(i.name)} (${escapeHtml(i.color)}, ${escapeHtml(i.size)}) — ₦${i.price.toLocaleString()}`)
    .join('<br/>');

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to,
    subject: `New order ${order.orderNumber || order.paystackReference} — ₦${order.totalAmount.toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">New order received</p>
        <p><strong>${escapeHtml(order.orderNumber || order.paystackReference)}</strong> — ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
        <p>${itemLines}</p>
        <p><strong>Total:</strong> ₦${order.totalAmount.toLocaleString()} (incl. ${order.shippingMethod} shipping)</p>
        <p><strong>Ship to:</strong> ${escapeHtml(order.shippingAddress)}</p>
      </div>
    `,
  });
  if (error) console.error('Order-notification email failed:', error);
}

export async function sendOrderConfirmationEmail(order) {
  const itemLines = order.items
    .map((i) => `${i.quantity} × ${escapeHtml(i.name)} (${escapeHtml(i.color)}, ${escapeHtml(i.size)}) — ₦${i.price.toLocaleString()}`)
    .join('<br/>');

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Lara's Crochet <onboarding@resend.dev>",
    to: order.customerEmail,
    subject: `Order confirmed — ${order.orderNumber || order.paystackReference}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">Thank you, ${escapeHtml(order.customerName)}!</p>
        <p style="color: #737373;">Your order <strong>${order.orderNumber || order.paystackReference}</strong> is confirmed.</p>
        <p>${itemLines}</p>
        <p><strong>Total:</strong> ₦${order.totalAmount.toLocaleString()} (incl. ${order.shippingMethod} shipping)</p>
        <p><strong>Shipping to:</strong> ${escapeHtml(order.shippingAddress)}</p>
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

/* ============================================================
   NEWSLETTER + ENQUIRIES
   ============================================================ */

// Footer of every newsletter-type email: who it's from + a working unsubscribe.
const emailFooter = (token) => `
  <p style="color:#A3A3A3;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
    You're receiving this because you subscribed to Lara's Crochet news.
    <a href="${unsubscribeUrl(token)}" style="color:#A3A3A3;">Unsubscribe</a>
  </p>`;

// "You're subscribed" — sent once, when someone newly subscribes (or comes back).
export async function sendSubscribeWelcome(subscriber) {
  const { error } = await resend.emails.send({
    from: FROM(),
    to: subscriber.email,
    subject: "You're subscribed to Lara's Crochet",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">Welcome to Lara's Crochet</p>
        <p style="color: #737373;">Thank you for subscribing — you'll be the first to hear about new pieces, restocks and exclusives.</p>
        <p><a href="${siteBase()}/shop" style="color:#4a0e1e;font-weight:bold;">Browse the shop</a></p>
        ${emailFooter(subscriber.unsubscribeToken)}
      </div>`,
    // Mail clients show a one-click "Unsubscribe" button when these are present.
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl(subscriber.unsubscribeToken)}>` },
  });
  if (error) console.error('Subscribe welcome email failed:', error);
}

// A newsletter Lara wrote in the admin. Sent in batches of 100 (Resend's limit
// for one batch call) — one separate email per person, so nobody sees anyone
// else's address and each email carries that person's own unsubscribe link.
export async function sendCampaign({ subject, body }, subscribers) {
  const safeBody = escapeHtml(body).replace(/\n/g, '<br/>');
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += 100) {
    const chunk = subscribers.slice(i, i + 100);
    const payload = chunk.map((sub) => ({
      from: FROM(),
      to: sub.email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0; color:#404040; line-height:1.6;">
          <p style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">Lara's Crochet</p>
          <div>${safeBody}</div>
          ${emailFooter(sub.unsubscribeToken)}
        </div>`,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl(sub.unsubscribeToken)}>` },
    }));
    try {
      const { error } = await resend.batch.send(payload);
      if (error) {
        console.error('Newsletter batch failed:', error);
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error('Newsletter batch threw:', err);
      failed += chunk.length;
    }
  }
  return { sent, failed };
}

// Lara gets the enquiry; hitting "Reply" in Gmail answers the customer directly.
export async function sendEnquiryNotification(enquiry) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return console.warn('ADMIN_NOTIFY_EMAIL not set — skipping enquiry notification');

  const m = enquiry.sizingMeasurements || {};
  const measurements = [m.size && `Size ${m.size}`, m.bust && `Bust ${m.bust}`, m.waist && `Waist ${m.waist}`, m.hip && `Hip ${m.hip}`]
    .filter(Boolean)
    .join(' · ');

  const { error } = await resend.emails.send({
    from: FROM(),
    to,
    replyTo: enquiry.customerEmail,
    subject: `Enquiry (${enquiry.topic}) — ${enquiry.customerEmail}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">New enquiry</p>
        <p><strong>From:</strong> ${escapeHtml(enquiry.customerEmail)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(enquiry.topic)}</p>
        ${enquiry.itemName ? `<p><strong>Item:</strong> ${escapeHtml(enquiry.itemName)}</p>` : ''}
        ${enquiry.orderRef ? `<p><strong>Order:</strong> ${escapeHtml(enquiry.orderRef)}</p>` : ''}
        ${measurements ? `<p><strong>Measurements:</strong> ${escapeHtml(measurements)}</p>` : ''}
        ${enquiry.message ? `<p><strong>Message:</strong><br/>${escapeHtml(enquiry.message).replace(/\n/g, '<br/>')}</p>` : ''}
        <p style="color:#A3A3A3;font-size:13px;">Just hit Reply — it goes straight to the customer.</p>
      </div>`,
  });
  if (error) console.error('Enquiry notification email failed:', error);
}

// Short "we got it" email to the customer, for both enquiries and custom orders.
export async function sendRequestReceived(email, kind) {
  const what = kind === 'custom' ? 'custom order request' : 'message';
  const { error } = await resend.emails.send({
    from: FROM(),
    to: email,
    subject: "We've got your " + what,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">Thank you!</p>
        <p style="color: #737373;">Lara has received your ${what} and will reply to this email address soon.</p>
      </div>`,
  });
  if (error) console.error('Request-received email failed:', error);
}


// Invitation to join the admin dashboard. The link opens /admin?invite=TOKEN,
// where the person chooses their own password (no password is ever emailed).
export async function sendTeamInvite(email, accessLevel, link, days) {
  const roleText = { admin: 'an admin', editor: 'an editor', viewer: 'a viewer (view-only)' }[accessLevel] || 'a team member';
  const { error } = await resend.emails.send({
    from: FROM(),
    to: email,
    subject: "You've been invited to the Lara's Crochet dashboard",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #404040;">Join the Lara's Crochet dashboard</p>
        <p style="color: #737373;">You've been invited as ${roleText}. Choose a password to get started:</p>
        <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#4a0e1e;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;">Set my password</a></p>
        <p style="color: #A3A3A3; font-size: 13px;">This link works for ${days} days. If you weren't expecting this, you can ignore the email.</p>
      </div>`,
  });
  // Unlike the other emails this one THROWS, so the admin sees "could not send" instead of a silent failure.
  if (error) {
    console.error('Team invite email failed:', error);
    throw new Error('Could not send invite email');
  }
}
