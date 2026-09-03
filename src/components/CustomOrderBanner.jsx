import reinaFront from '../assets/reina-front.png';
import customWordmark from '../assets/custom-orders-wordmark.png';
import { Link } from 'react-router-dom';

export default function CustomOrderBanner() {
  return (
    <section id="custom-orders" className="py-14 md:py-20 text-center">
      {/* TIP: "Custom" is the real Genty Demo export
          (custom-orders-wordmark.png), same as BrandStory's LARA
          wordmark and the Footer/Navbar logos — font-logo/Yellowtail
          is no longer used anywhere on the site now that both script
          text spots have real exports. "ORDERS" sits DM-Sans/uppercase
          to its upper right, matching where the Figma places it
          relative to the "t" in Custom. */}
      <h2 className="relative mb-8 inline-block">
        <img
          src={customWordmark}
          alt="Custom"
          className="h-16 md:h-24 w-auto select-none pointer-events-none"
        />
        <span className="absolute right-[6%] top-0 text-xs md:text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
          Orders
        </span>
      </h2>

      {/* TIP: design shows three different models/outfits standing
          together — we only have single-model product photography as
          assets right now, so this uses the one available shot rather
          than fabricating a composite that doesn't exist. Swap for the
          real 3-model photo once Lara/Teniayo provide it. */}
      <img
        src={reinaFront}
        alt="A custom crochet piece from Lara's Crochet"
        className="mx-auto h-72 md:h-96 w-auto object-contain"
      />

      <p className="mx-auto mt-8 max-w-lg text-sm text-[var(--muted)] leading-relaxed">
        Not seeing exactly what you want? Tell us your size, your color, your vision — and
        we'll crochet it just for you. Every custom piece is made from scratch, one stitch
        at a time, out of Lagos.
      </p>

      <Link
        to="/contact?flow=custom"
        className="mt-6 inline-block bg-[var(--maroon)] px-6 py-3 text-xs font-bold text-white hover:bg-[var(--maroon-dark)]"
      >
        Make a custom order
      </Link>
    </section>
  );
}
