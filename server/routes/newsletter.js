import { Router } from 'express';
import Subscriber from '../models/Subscriber.js';
import Campaign from '../models/Campaign.js';
import { requireAdmin, requireFullAdmin } from '../middleware/requireAdmin.js';
import { sendSubscribeWelcome, sendCampaign, escapeHtml } from '../utils/email.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TIP: shared by the footer form AND the checkout tick-box. Returns what
// happened so callers can decide what to say. Only a NEW subscriber (or
// someone coming back after unsubscribing) gets the welcome email — typing
// the same address twice doesn't spam them.
export async function subscribeEmail(rawEmail, source = 'footer') {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, reason: 'invalid' };

  let sub = await Subscriber.findOne({ email });
  if (sub?.subscribed) return { ok: true, status: 'already' };

  if (sub) {
    sub.subscribed = true;
    sub.subscribedAt = new Date();
    sub.unsubscribedAt = undefined;
    await sub.save();
  } else {
    sub = await Subscriber.create({ email, source });
  }

  // fire-and-forget: a slow/failed email must never fail the sign-up itself
  sendSubscribeWelcome(sub).catch((err) => console.error('Welcome email failed:', err));
  return { ok: true, status: 'subscribed' };
}

// POST /api/newsletter/subscribe   body: { email }   (public)
router.post('/subscribe', async (req, res) => {
  try {
    const result = await subscribeEmail(req.body?.email, 'footer');
    if (!result.ok) return res.status(400).json({ error: 'Please enter a valid email address.' });
    res.json({ status: result.status });
  } catch (err) {
    console.error('Newsletter subscribe failed:', err);
    res.status(500).json({ error: 'Could not subscribe right now. Please try again.' });
  }
});

// GET /api/newsletter/unsubscribe/:token   (public — the link inside every email)
router.get('/unsubscribe/:token', async (req, res) => {
  let message = "You've been unsubscribed. You won't receive any more newsletters from Lara's Crochet.";
  try {
    const sub = await Subscriber.findOneAndUpdate(
      { unsubscribeToken: req.params.token },
      { subscribed: false, unsubscribedAt: new Date() }
    );
    if (!sub) message = 'This unsubscribe link is not valid.';
  } catch (err) {
    console.error('Unsubscribe failed:', err);
    message = 'Something went wrong. Please try the link again in a moment.';
  }
  res.type('html').send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
    <body style="font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f7f6f3;margin:0">
      <div style="max-width:420px;padding:32px;text-align:center">
        <p style="font-size:22px;font-weight:bold;color:#4a0e1e">Lara's Crochet</p>
        <p style="color:#404040;line-height:1.5">${escapeHtml(message)}</p>
      </div></body>`);
});

/* ---------- admin ---------- */

// GET /api/newsletter/subscribers
router.get('/subscribers', requireAdmin, async (req, res) => {
  const subscribers = await Subscriber.find().sort({ subscribedAt: -1 }).select('-unsubscribeToken');
  res.json({
    subscribers,
    activeCount: subscribers.filter((s) => s.subscribed).length,
  });
});

// GET /api/newsletter/campaigns — history of what Lara has sent
router.get('/campaigns', requireAdmin, async (req, res) => {
  res.json(await Campaign.find().sort({ createdAt: -1 }).limit(50));
});

// POST /api/newsletter/send   body: { subject, body, testOnly? }
// TIP: only `subscribed: true` people are ever selected, so anyone who isn't
// subscribed (or who unsubscribed) never gets the message. testOnly sends a
// single copy to Lara's own address so she can check how it looks first.
router.post('/send', requireAdmin, requireFullAdmin, async (req, res) => {
  try {
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!subject || !body) return res.status(400).json({ error: 'Add a subject and a message first.' });
    if (subject.length > 150 || body.length > 10000) {
      return res.status(400).json({ error: 'That message is too long.' });
    }

    if (req.body?.testOnly) {
      // TIP: Lara can type any address to send the test to; if she leaves it
      // empty we fall back to ADMIN_NOTIFY_EMAIL from the server settings.
      const typed = String(req.body?.testEmail || '').trim().toLowerCase();
      if (typed && !EMAIL_RE.test(typed)) return res.status(400).json({ error: 'That test email address does not look right.' });
      const to = typed || process.env.ADMIN_NOTIFY_EMAIL;
      if (!to) return res.status(400).json({ error: 'Type an email address to send the test to.' });
      const result = await sendCampaign(
        { subject: `[TEST] ${subject}`, body },
        [{ email: to, unsubscribeToken: 'test' }]
      );
      return res.json({ test: true, to, ...result });
    }

    const subscribers = await Subscriber.find({ subscribed: true });
    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'You have no subscribers yet.' });
    }

    const { sent, failed } = await sendCampaign({ subject, body }, subscribers);
    const campaign = await Campaign.create({
      subject,
      body,
      recipientCount: sent,
      failedCount: failed,
      sentBy: String(req.adminId),
    });
    res.json({ sent, failed, campaign });
  } catch (err) {
    console.error('Newsletter send failed:', err);
    res.status(500).json({ error: 'Could not send the newsletter. Please try again.' });
  }
});

export default router;
