import Reveal from './Reveal';
import reinaFront from '../assets/reina-front.png';
import { Link } from 'react-router-dom';

export default function CustomOrderBanner() {
  return (
    <section id="custom-orders" className="bg-[var(--maroon)] text-[#f5efe9] py-14 md:py-20">
      <Reveal>
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10">
          Make a Custom Order
        </h2>
      </Reveal>

      {/* Mobile: horizontal scroll strip (swiping sideways feels
          natural on a phone). Desktop: a 6-column grid that fills
          the full section width edge to edge with no scrolling —
          six is enough to divide evenly without overflow at normal
          screen widths, so no scroll bar is needed once there's
          more room. */}
      <div className="flex gap-3 px-5 overflow-x-auto md:grid md:grid-cols-6 md:gap-4 md:px-8 md:overflow-visible scrollbar-hide">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative aspect-[3/4] w-40 md:w-auto shrink-0 bg-[#f5efe9]/10 overflow-hidden"
          >
            <img
              src={reinaFront}
              alt="Custom crochet piece example"
              className="w-full h-full object-contain opacity-95"
            />
          </div>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="text-center mt-10">
          <Link
            to="/contact?flow=custom"
            className="inline-flex items-center gap-2 border border-[#f5efe9] px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#f5efe9] hover:text-[var(--maroon)] transition-colors"
          >
            Make a Custom Order <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
