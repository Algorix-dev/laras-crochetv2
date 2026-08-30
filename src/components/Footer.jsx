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
import lacMonogram from "../assets/lac-monogram.png";

const columns = [
  {
    title: "General",
    links: [
      { label: "Shop", to: "/" },
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
    <footer className="pt-14 pb-0 px-76.25">
      {/* TIP: the Figma export shows the link columns naturally-sized
          and grouped on the left, with the newsletter column pushed
          to the far right by justify-between — NOT an even grid of
          equal-width columns. Newsletter also appears on every page's
          footer in the export (Shop, Addresses, etc.), not just
          account pages, so it's no longer conditional. */}
      <div className="mx-auto mb-16 flex max-w-7xl flex-wrap justify-between gap-x-16 gap-y-10 px-5 md:px-8">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-tight">
                {col.title}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[var(--maroon)]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="hover:text-[var(--maroon)]">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="w-full max-w-xs sm:w-auto">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-tight">
            Subscribe to Our Newsletter
          </h3>
          {subscribed ? (
            <p className="text-sm text-[var(--muted)]">
              You're subscribed — thank you!
            </p>
          ) : (
            <>
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full min-w-0 border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[var(--maroon)] px-4 text-xs font-bold uppercase text-white hover:bg-[var(--maroon-dark)]"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-1.5 text-xs text-[var(--muted)]">Enjoy latest exclusives.</p>
            </>
          )}
        </div>
      </div>

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
      <div className="mt-6 w-full overflow-hidden flex justify-center">
        <img
          src={lacMonogram}
          alt="Lara's Crochet Monogram"
          aria-hidden="true"
          className="w-full h-auto mix-blend-multiply opacity-95 block align-bottom -mb-2 sm:-mb-4 md:-mb-6"
        />
      </div>
    </footer>
  );
}
