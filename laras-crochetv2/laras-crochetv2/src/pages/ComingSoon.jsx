/*
  TIP: This is a placeholder page shown for routes that aren't
  ready yet. It looks intentional and on-brand — not like a broken
  page — so the client sees polish even on unfinished sections.

  To "unlock" a page, go to App.jsx and swap <ComingSoon /> back
  to the real component (e.g. <ShopPage />).
*/
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function ComingSoon() {
  return (
    <>
      <main className="min-h-screen">
        <section className="flex min-h-[70vh] items-center justify-center px-5 text-center">
          <div>
            <h1 className="font-display text-3xl md:text-5xl italic mb-3">
              Coming Soon
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-8">
              This section is still being crafted. Each piece at Lara's Crochet
              is made with care — the website is no different.
            </p>
            <Link
              to="/"
              className="inline-block bg-[var(--ink)] text-white text-xs uppercase tracking-widest px-8 py-3.5 hover:bg-[var(--maroon)] transition-colors font-bold"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
