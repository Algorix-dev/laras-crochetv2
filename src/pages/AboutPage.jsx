import { Link } from 'react-router-dom';
import laraPortrait from '../assets/lara-portrait.jpg';
import laraSunglasses from '../assets/lara-sunglasses.jpg';
import Footer from '../components/Footer';

/*
  TIP: This is the About page — it tells the story behind Lara's Crochet.
  The left column shows a full-body portrait of Lara, and the right column
  has the brand heading, a smaller lifestyle photo, the story, and links.

  The two photos are real images of Lara (not product shots), so we use
  object-cover to fill the frame nicely instead of object-contain.
*/
export default function AboutPage() {
  return (
    <>
      {/* TIP: Main grid — single column on mobile, two columns on md+ breakpoints. */}
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-2 md:px-8 md:py-16">
        {/* TIP: Left column — full-body portrait of Lara.
            We use object-cover so the photo fills the frame nicely,
            and a tall aspect ratio to match the full-body shot. */}
        <img
          src={laraPortrait}
          alt="Lara — founder of Lara's Crochet"
          className="aspect-[3/4] w-full object-cover"
        />

        {/* TIP: Right column — heading, rotated label, lifestyle image, story, and links. */}
        <section className="flex flex-col justify-center">
          {/* TIP: Page heading — large italic display font. */}
          <h1 className="font-display text-6xl italic md:text-7xl">
            This is Lara&apos;s Crochet
          </h1>

          {/* TIP: Rotated "MEET LARA" label beside a lifestyle photo.
            The photo is smaller and shows Lara in a casual pose. */}
          <div className="mt-10 flex items-center gap-5">
            <p className="-rotate-90 whitespace-nowrap text-xs tracking-[.25em]">
              MEET LARA
            </p>
            <img
              src={laraSunglasses}
              alt="Lara on a crosswalk"
              className="aspect-[3/4] w-44 object-cover"
            />
          </div>

          {/* TIP: Brand story paragraph — explains the handmade, slow-fashion ethos. */}
          <p className="mt-9 max-w-xl text-sm leading-8 text-[var(--muted)]">
            At Lara&apos;s Crochet, every piece starts as a single strand of yarn
            and a pair of hands. No factories, no shortcuts — just crochet made
            with love, one piece at a time, out of Lagos, Nigeria. We believe in
            slow fashion that tells a story, and we&apos;d love for you to be
            part of ours.
          </p>

          {/* TIP: Action links — Instagram social link and navigation back to the shop. */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm underline underline-offset-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              Connect with Lara&apos;s Crochet
            </a>
            <Link to="/">Back to Shop</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}