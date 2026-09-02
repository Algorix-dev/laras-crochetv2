import Reveal from './Reveal';

export default function CategoryIntro() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-start">
      <Reveal>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--muted)] mb-3">
          <span>🧵</span>
          <span>/01 Discover</span>
        </div>
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
          Bikinis
          <br />
          Dresses
          <br />
          Two-Pieces
        </h2>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="text-sm md:text-base leading-relaxed text-[var(--muted)] space-y-4 md:pt-4">
          <p>
            At Lara's Crochet, every piece here starts as a single strand of
            yarn and a pair of hands, no factories, no shortcuts. Made-to-order,
            one piece at a time, out of Lagos, Nigeria.
          </p>
          <p>We don't keep a stockroom.</p>
          <p>
            When you order, your piece is made for you — your size, your
            color, your fit. It takes time, because handmade always does, but
            it means what arrives at your door was never sitting on a shelf
            waiting for someone else.
          </p>
          <p>This isn't fast fashion. It's a craft, made with love.</p>
        </div>
      </Reveal>
    </section>
  );
}
