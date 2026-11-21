import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useBrand } from '../BrandProvider';
import { LEGAL } from '../data/legal';

/* -----------------------------------------------------------
   TIP — THE THREE LEGAL PAGES (/privacy, /terms, /returns)
   All three share this layout. Business details come from
   src/data/legal.js — a value left empty there shows up here as a
   yellow "[Lara to confirm: …]" mark so it can't be missed.
----------------------------------------------------------- */

// shows a value, or a highlighted blank if it hasn't been filled in yet
function Fill({ value, label }) {
  if (value !== undefined && value !== null && String(value).trim() !== '') return <>{value}</>;
  return (
    <mark className="rounded bg-yellow-200 px-1 text-black">[Lara to confirm: {label}]</mark>
  );
}

function useContact() {
  const brand = useBrand() || {};
  return { ...LEGAL, email: LEGAL.email || brand.email || '' };
}

function Shell({ title, intro, children }) {
  return (
    <>
      <main className="px-5 pb-20 pt-10 md:px-8 md:pt-14 lg:px-[15.83%]">
        <article className="mx-auto max-w-3xl text-[var(--ink,#404040)]">
          <h1 className="text-[2rem] font-bold uppercase leading-tight tracking-[-0.02em] text-[var(--maroon,#412B2D)] md:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted,#737373)]">Last updated: {LEGAL.lastUpdated}</p>
          {intro && <p className="mt-6 text-base leading-7">{intro}</p>}
          <div className="mt-8 space-y-8">{children}</div>
          <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/10 pt-6 text-sm uppercase">
            <Link to="/privacy" className="hover:text-[var(--maroon,#412B2D)]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[var(--maroon,#412B2D)]">Terms &amp; Conditions</Link>
            <Link to="/returns" className="hover:text-[var(--maroon,#412B2D)]">Returns &amp; Shipping</Link>
            <Link to="/contact" className="hover:text-[var(--maroon,#412B2D)]">Contact</Link>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}

const H = ({ children }) => (
  <h2 className="mb-3 text-[1.25rem] font-semibold text-[var(--maroon,#412B2D)]">{children}</h2>
);
const P = ({ children }) => <p className="mt-3 text-base leading-7">{children}</p>;
const UL = ({ items }) => (
  <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7">
    {items.map((t, i) => <li key={i}>{t}</li>)}
  </ul>
);

function ContactBlock() {
  const c = useContact();
  return (
    <ul className="mt-3 space-y-1 text-base leading-7">
      <li><strong>{c.tradingName}</strong>{c.businessName && c.businessName !== c.tradingName ? <> ({c.businessName})</> : null}</li>
      <li>Registration: <Fill value={c.registration} label="CAC registration number, or “Not registered”" /></li>
      <li>Address: <Fill value={c.address} label="business address" /></li>
      <li>Email: {c.email ? <a className="underline" href={`mailto:${c.email}`}>{c.email}</a> : <Fill value="" label="support email" />}</li>
      <li>Phone / WhatsApp: <Fill value={c.phone} label="phone or WhatsApp number" /></li>
    </ul>
  );
}

/* ===================== PRIVACY POLICY ===================== */
export function PrivacyPolicyPage() {
  const c = useContact();
  return (
    <Shell
      title="Privacy Policy"
      intro={`This policy explains what personal information ${c.tradingName} collects when you use our website, why we collect it, who we share it with, and the choices you have. We handle personal data in line with the Nigeria Data Protection Act 2023 (NDPA).`}
    >
      <section>
        <H>1. Who we are</H>
        <P>The Lara’s Crochet website (“the site”) is operated by the business below, which is the “data controller” responsible for your personal information.</P>
        <ContactBlock />
      </section>

      <section>
        <H>2. The information we collect</H>
        <UL items={[
          'Account details: your name and email address when you sign in (we send a one-time code to your email) or sign in with Google.',
          'Order details: items ordered, delivery name, phone number and delivery address, shipping method, order notes, discount codes used, and the status of your order.',
          'Payment details: payments are processed by Paystack. We do not see or store your full card number or PIN. We receive a payment reference, the payment status and the card type used.',
          'Custom order requests: the details you give us about the piece you want, any photos you upload, and body measurements or fit details (for example bust, waist and hip) so we can make the piece to fit you.',
          'Messages: anything you send through our contact and enquiry forms.',
          'Reviews: your name or initials, rating, fit feedback and any photo you choose to submit.',
          'Newsletter: your email address if you subscribe.',
          'Saved preferences: your wishlist, bag, chosen country and currency, and sign-in session, which are kept in your browser’s storage on your device.',
          'Basic visit information: a random visitor code created by your browser, the page you are on and the time (to the minute), so we can see roughly how many people use the site. This does not include your name, email address or IP address, and these records are automatically deleted after 45 days.',
        ]} />
      </section>

      <section>
        <H>3. Why we use your information</H>
        <UL items={[
          'To create and run your account and keep you signed in securely.',
          'To take, make, ship and track your orders, and to contact you about them (our contract with you).',
          'To take payment and prevent fraud (our contract with you and our legitimate interest in keeping the shop secure).',
          'To make custom pieces to your measurements, and to answer your messages and enquiries.',
          'To send you marketing emails or messages about new pieces and offers, where you have agreed to receive them. You can opt out at any time (see section 8).',
          'To understand how the site is used and improve it (our legitimate interest).',
          'To meet our legal, tax and accounting obligations.',
        ]} />
      </section>

      <section>
        <H>4. Who we share it with</H>
        <P>We do not sell your personal information. We share it only with service providers who help us run the shop, and only as needed for their job:</P>
        <UL items={[
          'Paystack, to process payments.',
          'Delivery and courier partners, to deliver your order (they receive your name, phone number and address).',
          'Cloudinary, which stores the product photos and any photos you upload with a custom order or review.',
          'Resend, which sends our emails (such as your sign-in code and order updates).',
          'Google, if you choose to sign in with Google.',
          'Our hosting and database providers, which store the site and its data.',
          'Professional advisers, regulators, courts or law enforcement where the law requires it.',
        ]} />
        <P>Some of these providers are based outside Nigeria, so your information may be processed in other countries. Where that happens we take steps to make sure it stays protected, as the NDPA requires.</P>
      </section>

      <section>
        <H>5. How long we keep it</H>
        <P>We keep your information only as long as we need it for the reasons above. Order records are kept for <Fill value={c.dataRetention} label="how long order records are kept, e.g. “6 years after your last order”" /> for tax and accounting purposes. Visit records are deleted after 45 days. You can ask us to delete your account at any time (see section 8), except for records we are legally required to keep.</P>
      </section>

      <section>
        <H>6. Keeping it secure</H>
        <P>We use reasonable technical and organisational measures to protect your information, including encrypted connections (HTTPS), one-time sign-in codes instead of stored passwords, and limited access for our team. No system is completely secure, so please keep your email account safe too. If a data breach is likely to put your rights at risk, we will tell you and the Nigeria Data Protection Commission as the law requires.</P>
      </section>

      <section>
        <H>7. Cookies and similar technologies</H>
        <P>We use your browser’s storage to keep you signed in and to remember your bag, wishlist, country and currency. We do not use this to track you across other websites. You can clear this storage in your browser settings, but you may need to sign in again and your bag and wishlist will be reset.</P>
      </section>

      <section>
        <H>8. Your rights</H>
        <P>Under the NDPA you have the right to:</P>
        <UL items={[
          'ask what personal information we hold about you and get a copy;',
          'ask us to correct information that is wrong or incomplete;',
          'ask us to delete your information, or to restrict how we use it;',
          'receive your information in a common format and ask us to pass it to another provider;',
          'object to our use of your information, including for marketing;',
          'withdraw your consent at any time (this does not affect what we did before you withdrew it).',
        ]} />
        <P>To use any of these rights, or to unsubscribe from marketing, email us at {c.email ? <a className="underline" href={`mailto:${c.email}`}>{c.email}</a> : <Fill value="" label="support email" />} or use the unsubscribe link in any marketing email. We will respond within the time the law allows. If you are unhappy with how we handle your information, you can complain to the Nigeria Data Protection Commission (NDPC).</P>
      </section>

      <section>
        <H>9. Children</H>
        <P>Our shop is meant for adults. We do not knowingly collect personal information from anyone under 18. If you think a child has given us their information, contact us and we will delete it.</P>
      </section>

      <section>
        <H>10. Links to other sites</H>
        <P>Our site links to other websites, such as Instagram and Paystack’s payment page. We are not responsible for their privacy practices, so please read their policies.</P>
      </section>

      <section>
        <H>11. Changes to this policy</H>
        <P>We may update this policy from time to time. The “last updated” date at the top shows when it last changed. If we make an important change, we will let you know on the site or by email.</P>
      </section>

      <section>
        <H>12. Contact us</H>
        <P>Questions about this policy or your information? Contact us:</P>
        <ContactBlock />
      </section>
    </Shell>
  );
}

/* ===================== TERMS & CONDITIONS ===================== */
export function TermsPage() {
  const c = useContact();
  return (
    <Shell
      title="Terms & Conditions"
      intro={`These terms apply when you browse or buy from ${c.tradingName}. By using the site or placing an order, you agree to them, so please read them carefully.`}
    >
      <section>
        <H>1. About us</H>
        <P>This site is run by:</P>
        <ContactBlock />
      </section>

      <section>
        <H>2. Using the site</H>
        <P>You must be at least 18 to place an order, or have a parent or guardian’s permission. Please give us accurate information and keep your sign-in details to yourself. You are responsible for what happens under your account. Please do not misuse the site, try to break into it, copy it automatically (scraping), or use it for anything unlawful.</P>
      </section>

      <section>
        <H>3. Our products</H>
        <P>Every piece is hand-crocheted and made to order. Because each one is made by hand, small differences in size, stitch, shade and finish are normal and are part of what makes a piece unique. Colours on your screen may look slightly different from the real yarn. The delivery window shown at checkout includes the time we need to make your piece (see our <Link className="underline" to="/returns">Returns &amp; Shipping</Link> page).</P>
      </section>

      <section>
        <H>4. Prices and payment</H>
        <P>The price and currency you will be charged are shown at checkout before you pay. Delivery fees are calculated from your address and shown at checkout. Payments are made securely through Paystack. Your order is only confirmed once your payment has gone through and we have sent you a confirmation. Discount codes follow the conditions shown with the code, may expire, and may be withdrawn.</P>
        <P>We try to keep our prices and descriptions accurate. If we find a mistake after you order, we will tell you and give you the choice to continue at the correct price or cancel for a full refund.</P>
      </section>

      <section>
        <H>5. Accepting and cancelling orders</H>
        <P>We may decline or cancel an order, for example if a material is unavailable, we suspect fraud, or we cannot deliver to your address. If we cancel an order you have already paid for, we will refund you in full.</P>
        <P>Because pieces are made to order, we start work soon after payment. If you need to change or cancel an order, contact us as soon as possible. We will do our best, but once work has started we may not be able to cancel it. The cancellation rule in section 6 applies to custom orders only, not to ordinary orders.</P>
      </section>

      <section>
        <H>6. Custom orders</H>
        <P>Custom pieces are quoted individually. The design, price and timeline are agreed with you in writing (by email or message) before work starts. For custom orders, <Fill value={c.customOrderPayment} label="payment terms for custom orders" />. Cancellations: <Fill value={c.customOrderCancellation} label="custom order cancellation terms" />. Custom pieces are made to the measurements you give us, so please check your measurements carefully before you send them.</P>
      </section>

      <section>
        <H>7. Delivery</H>
        <P>We deliver within Nigeria and internationally. Delivery times shown at checkout are estimates, not guarantees, and can be affected by things outside our control such as courier delays or customs. Please make sure your delivery address and phone number are correct. International orders: <Fill value={c.importDuties} label="who pays import duties and taxes" />. More detail is on our <Link className="underline" to="/returns">Returns &amp; Shipping</Link> page.</P>
      </section>

      <section>
        <H>8. Returns, defects and refunds</H>
        <P>As each piece is made to order, we cannot accept returns for change of mind. If you receive a defective item, please contact us within {c.defectWindowDays} days of delivery. The full process is on our <Link className="underline" to="/returns">Returns &amp; Shipping</Link> page. Nothing in these terms limits your legal rights as a consumer under Nigerian law.</P>
      </section>

      <section>
        <H>9. Intellectual property</H>
        <P>The designs, photographs, text, logos and other content on this site belong to {c.tradingName} or are used with permission. You may view them and share links for personal, non-commercial use. Please do not copy, reproduce, sell or use our designs or images without our written permission.</P>
      </section>

      <section>
        <H>10. Your reviews and uploads</H>
        <P>If you submit a review, photo or other content, you confirm it is yours to share and is honest, lawful and not offensive. You give us permission to display it on the site and in our marketing, and we may remove it if it breaks these terms. You keep ownership of your content.</P>
      </section>

      <section>
        <H>11. Our responsibility to you</H>
        <P>We take care to make and deliver every piece well. We are responsible for loss or damage you suffer that is a foreseeable result of us breaking these terms or being negligent. We do not exclude or limit liability where the law does not allow it. We are not responsible for delays or failures caused by events outside our reasonable control, or for problems with third-party services such as payment providers or couriers, beyond our obligations under the law. The site is provided “as is” and we cannot promise it will always be available or error-free.</P>
      </section>

      <section>
        <H>12. Privacy</H>
        <P>How we use your personal information is explained in our <Link className="underline" to="/privacy">Privacy Policy</Link>.</P>
      </section>

      <section>
        <H>13. Changes to these terms</H>
        <P>We may update these terms from time to time. The version on the site when you place an order is the one that applies to that order.</P>
      </section>

      <section>
        <H>14. Governing law and disputes</H>
        <P>These terms are governed by the laws of the Federal Republic of Nigeria. If we have a problem, please contact us first so we can try to sort it out. If we cannot, we will first try to settle it through mediation at the Lagos Multi-Door Courthouse. If that does not resolve it, the courts of <Fill value={c.disputeCourtState} label="state whose courts handle disputes" />, Nigeria, will have jurisdiction.</P>
      </section>

      <section>
        <H>15. Contact us</H>
        <ContactBlock />
      </section>
    </Shell>
  );
}

/* ===================== RETURNS & SHIPPING ===================== */
export function ReturnsPage() {
  const c = useContact();
  return (
    <Shell
      title="Returns & Shipping"
      intro={`Everything you need to know about how ${c.tradingName} makes, ships and, if needed, puts right your order.`}
    >
      <section>
        <H>1. Made to order</H>
        <P>Every piece is hand-crocheted for you after you order. The delivery window you see at checkout already includes the time it takes to make your piece, so there is no separate waiting period on top of it.</P>
      </section>

      <section>
        <H>2. Shipping and delivery</H>
        <UL items={[
          'We ship within Nigeria and internationally.',
          'At checkout you choose Standard (10–14 days) or Express (4–5 days). These are counted in days from the date you place your order, and the same window applies however many pieces you order.',
          'The delivery fee is worked out from your delivery address and shown at checkout before you pay.',
          'Delivery times are estimates. Courier delays and customs checks can happen and are outside our control.',
          'You can follow your order from your account under “Orders”.',
          'Please check your address and phone number carefully. We cannot be responsible for orders delivered to an address that was entered incorrectly.',
        ]} />
        <P>International orders: <Fill value={c.importDuties} label="who pays import duties and taxes" />.</P>
      </section>

      <section>
        <H>3. Returns</H>
        <P>As each piece is made to order, we cannot accept returns for change of mind. Please check sizing and measurements carefully before ordering. If you are unsure, contact us and we will gladly help you choose.</P>
      </section>

      <section>
        <H>4. Defective or damaged items</H>
        <P>If your item arrives defective or damaged, please contact us within {c.defectWindowDays} days of delivery.</P>
        <UL items={[
          'Email us at the address below with your order number and clear photos of the problem.',
          'We will review it and reply to let you know the next steps.',
          <>If the item is faulty, <Fill value={c.defectRemedy} label="repair, replacement or refund" />, free of charge.</>,
          <>Sending the item back: <Fill value={c.returnShippingPayer} label="who pays return shipping for a defective item" />.</>,
        ]} />
        <P>Normal variations in a handmade piece, such as small differences in stitch or shade, are not defects.</P>
      </section>

      <section>
        <H>5. Refunds</H>
        <P>Approved refunds are paid <Fill value={c.refundMethod} label="refund method, e.g. “to the original payment method via Paystack”" /> <Fill value={c.refundTimeline} label="refund timeline, e.g. “within 7 business days of approval”" />. Your bank may take extra time to show the money.</P>
      </section>

      <section>
        <H>6. Custom orders</H>
        <P>Custom pieces are made to your measurements, so the return rules above apply. Payment and cancellation terms for custom orders are in our <Link className="underline" to="/terms">Terms &amp; Conditions</Link>.</P>
      </section>

      <section>
        <H>7. Your legal rights</H>
        <P>Nothing on this page affects your legal rights as a consumer under Nigerian law.</P>
      </section>

      <section>
        <H>8. Contact us</H>
        <ContactBlock />
      </section>
    </Shell>
  );
}
