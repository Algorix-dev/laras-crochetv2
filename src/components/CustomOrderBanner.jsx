import customOrdersTrio from '../assets/model-images/custom-orders-trio.png';
import { Link } from 'react-router-dom';

export default function CustomOrderBanner() {
  return (
    <section id="custom-orders" className="py-14 md:py-20 text-center">
      <h2 className="mb-8 flex items-center justify-center gap-3 text-3xl md:text-4xl">
        <span className="font-logo text-[var(--maroon)]">Custom</span>
        <span className="font-bold uppercase tracking-wide text-[var(--ink)]">Orders</span>
      </h2>

      {/* Real 3-model photo from Lara, matching the Figma composite —
          replaces the earlier single-model stand-in. */}
      <img
        src={customOrdersTrio}
        alt="Three custom crochet pieces from Lara's Crochet"
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
