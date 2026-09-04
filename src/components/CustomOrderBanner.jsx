<<<<<<< HEAD
import customTrio from '../assets/model-images/custom-orders-trio.png';
import customWordmark from '../assets/custom-orders-wordmark.png';
import arcSwirl from '../assets/decor/arc-swirl.png';
import threadBand from '../assets/decor/thread-band.png';
=======
import customOrdersTrio from '../assets/model-images/custom-orders-trio.png';
>>>>>>> 031125810c1a8e15383e81d8975eeba0dbb16685
import { Link } from 'react-router-dom';

export default function CustomOrderBanner() {
  return (
<<<<<<< HEAD
    <section id="custom-orders" className="relative overflow-clip py-14 md:py-20 text-center">
      {/* Same decorative arcs as BrandStory (Figma's Group 30/32),
          this section's own instance sits higher up its frame
          (top ~194px of 1920 vs ~824px), plus Group 33 — a full-width
          soft rainbow thread band behind the "Custom" wordmark. */}
      <img
        src={arcSwirl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute z-0 opacity-20 blur-[4.5px]"
        style={{ width: "69.84vw", left: "-9.58vw", top: "10.11vw", maxWidth: "none" }}
      />
      <img
        src={arcSwirl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute z-0 opacity-20 blur-[4.5px]"
        style={{ width: "71.09vw", left: "37.81vw", top: "10.04vw", maxWidth: "none", transform: "scaleX(-1)" }}
      />
      <img
        src={threadBand}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute z-0 opacity-30 blur-[6.5px]"
        style={{ width: "100vw", left: "50%", top: "18.69vw", transform: "translateX(-50%)", maxWidth: "none" }}
      />
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

      {/* Three models/outfits standing together, matching the Figma. */}
      <img
        src={customTrio}
        alt="Three custom crochet pieces from Lara's Crochet"
        className="relative z-10 mx-auto h-72 md:h-96 w-auto object-contain"
=======
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
>>>>>>> 031125810c1a8e15383e81d8975eeba0dbb16685
      />

      <p className="relative mx-auto mt-8 max-w-lg text-sm text-[var(--muted)] leading-relaxed">
        Not seeing exactly what you want? Tell us your size, your color, your vision — and
        we'll crochet it just for you. Every custom piece is made from scratch, one stitch
        at a time, out of Lagos.
      </p>

      <Link
        to="/contact?flow=custom"
        className="relative mt-6 inline-block bg-[var(--maroon)] px-6 py-3 text-xs font-bold text-white hover:bg-[var(--maroon-dark)]"
      >
        Make a custom order
      </Link>
    </section>
  );
}
