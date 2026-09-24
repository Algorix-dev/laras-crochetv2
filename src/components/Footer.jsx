/*
  TIP: The footer has two parts:
  1. A link grid (General, Support, Socials columns)
  2. A massive "LAC" monogram in Yellowtail script font that spans
     the full width — this is the brand's signature visual element.

  We use <Link> from react-router-dom so navigation stays smooth
  without full page reloads.
*/
import { Link } from "react-router-dom";
import { useState } from "react";
import lacMonogram from "../assets/lara-monogram.webp";
import Reveal from "./Reveal";

const columns = [
  {
    title: "General",
    links: [
      { label: "Shop", to: "/shop" },
      { label: "About", to: "/about" },
      { label: "Custom Orders", to: "/contact?flow=custom" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Enquiries", to: "/contact" },
    ],
  },
  {
    title: "Socials",
    links: [{ label: "Instagram", href: "https://instagram.com" }],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    // TIP: no backend endpoint for this yet — wiring it to a real
    // mailing list (Mailchimp, Klaviyo, etc.) is a separate small
    // task once Lara picks a provider. For now this just confirms
    // the interaction locally so the UI isn't a dead end.
    setSubscribed(true);
  };

  return (
    <footer className="pt-6 pb-0 md:pt-8">
      {/* TIP — TOP SPACING: was pt-14 (56px). Tightened because on Lara's
          laptop the gap above the footer felt like too much. */}
      {/* TIP: the Figma export shows the link columns naturally-sized
          and grouped on the left, with the newsletter column pushed
          to the far right by justify-between — NOT an even grid of
          equal-width columns. Newsletter also appears on every page's
          footer in the export (Shop, Addresses, etc.), not just
          account pages, so it's no longer conditional. */}
      {/* TIP — 304px SHARED MARGIN: px-5 md:px-8 lg:px-[15.83%] is
          the same class used in Navbar/Hero/ProductGrid, so the
          footer's link columns line up with everything above them
          instead of using their own lg:px-24 (96px) scale. Dropped
          max-w-7xl for the same reason as ProductGrid — it was
          capping this section's width independently of the rest of
          the page. */}
      {/* TIP — WHY THE INSTAGRAM / NEWSLETTER SIDE WAS DROPPING DOWN:
          the newsletter block had a hard minimum width (input
          min-w-[356px] + a 208px button = 564px) and the gaps were a
          fixed 64px. At 1920px there's room for all of that, but on a
          laptop at 125-150% display scaling the browser is really only
          ~1280-1536px wide, the row ran out of space, and flex-wrap
          pushed the right-hand column onto a second line below the
          links (and out of view). Now the gaps and the newsletter block
          scale with the viewport (clamp), and the input flexes instead
          of having a hard minimum — so links + newsletter stay on ONE
          row at every desktop width (at 1920px it looks essentially
          the same as before). */}
      <Reveal>
      {/* TIP — THE PHONE FOOTER (Lara's mobile design). On phones everything is
          ONE column and the order is flipped: newsletter first (centred), then
          General, Support and Socials stacked one under another, then the
          monogram. From md (768px) up nothing changes: links left, newsletter
          right. Every phone-only rule below is written `max-md:` so the desktop
          classes stay exactly as they were. To adjust phone spacing, change:
            gap-y-9        space between the newsletter and the links
            gap-y-16       space between General / Support / Socials */}
      <div className="flex flex-col gap-y-9 px-5 md:flex-row md:flex-wrap md:justify-between md:gap-x-[clamp(2rem,4vw,4rem)] md:gap-y-10 md:px-8 lg:px-[15.83%]">
        <div className="flex flex-col gap-y-16 md:flex-row md:flex-wrap md:gap-x-[clamp(2rem,4vw,4rem)] md:gap-y-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-[20px] font-bold uppercase tracking-[-4%] max-md:mb-6 max-md:text-[16.5px] max-md:tracking-[-0.04em] max-md:text-black">
                {col.title}
              </h3>
              <ul className="space-y-2 text-[16px] text-[var(--muted)] max-md:space-y-[10px] max-md:text-[14.5px] max-md:text-[var(--ink)]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[var(--maroon)] uppercase"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="hover:text-[var(--maroon)] uppercase">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* TIP: `max-md:order-first` moves this block above the links on phones
            without touching the DOM order (desktop keeps links-left). It is a
            flex column so the "Enjoy latest exclusives." line can be placed
            between the heading and the form on phones (order-2) but stay UNDER
            the form on desktop (default order). */}
        <div className="flex w-full flex-col md:max-w-[35.25rem] lg:w-[clamp(20rem,27.5vw,35.25rem)] max-md:order-first max-md:text-center">
          <h3 className="mb-3 text-[20px] font-bold uppercase tracking-[-4%] max-md:order-1 max-md:mb-1.5 max-md:text-[20.5px] max-md:tracking-[-0.04em] max-md:text-black">
            Subscribe to Our Newsletter
          </h3>
          {subscribed ? (
            <p className="text-sm text-[var(--muted)] max-md:order-2">
              You're subscribed — thank you!
            </p>
          ) : (
            <>
              <form onSubmit={handleSubscribe} className="flex max-md:order-3 max-md:flex-col max-md:gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="min-w-0 flex-1 border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)] max-md:h-[47px] max-md:flex-none max-md:border-[#e3e3e3] max-md:bg-transparent"
                />
                <button
                  type="submit"
                  className="h-12 w-[clamp(7.5rem,10.8vw,13rem)] shrink-0 bg-[var(--maroon)] px-4 text-[16px] font-bold uppercase text-white hover:bg-[var(--maroon-dark)] max-md:h-[50px] max-md:w-full"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-1.5 text-xs text-[var(--muted)] max-md:order-2 max-md:mb-[22px] max-md:mt-0 max-md:text-[16px] max-md:tracking-normal max-md:text-[#a9acb2]">Enjoy latest exclusives.</p>
            </>
          )}
        </div>
      </div>
      </Reveal>

      {/* TIP — licensing: "Genty Demo" (the font you sent) is
          personal-use-only, and its license explicitly forbids web
          embedding even for personal use — using it here would be
          a real violation, not just a style risk. Using Yellowtail
          (Google Fonts, free for commercial use) as a stand-in with
          a similar bold script feel. If Lara buys the commercial
          Genty license, swap it in by: 1) adding the purchased font
          file to src/assets/fonts/, 2) adding an @font-face rule
          for it in index.css, 3) changing font-['Yellowtail'] below
          to font-['Genty_Demo']. */}
      {/* TIP — PHONES: max-md:mt-[33px] is the gap between INSTAGRAM and the
          monogram; -mb-[5px] (on the image) crops 5px off the bottom of the
          lettering (the image has empty space at the top, so this leaves the
          same amount of lettering showing as the phone design). */}
      <div className="w-full overflow-hidden flex justify-center mt-10 md:mt-16 max-md:mt-[33px]">
        <img
          src={lacMonogram}
          alt="Lara's Crochet Monogram"
          aria-hidden="true"
          className="w-full h-auto mix-blend-multiply opacity-95 block align-bottom -mb-[5px] sm:-mb-4 md:-mb-6"
        />
      </div>
    </footer>
  );
}